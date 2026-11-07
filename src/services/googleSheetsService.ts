import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ConfusionTable15Result, buildGoogleSheetsConfusionData } from '../utils/coinModelLogic.ts';

// Initialize Firebase App instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Provider with Google Sheets scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Flag to indicate ongoing sign-in
let isSigningIn = false;
// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface SignInResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  cancelled?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export const googleSignIn = async (): Promise<SignInResult> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      return {
        success: false,
        errorMessage: 'Failed to obtain access token from Google sign in',
      };
    }

    cachedAccessToken = credential.accessToken;
    return {
      success: true,
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      // User closed the popup window before finishing sign-in
      console.info('Google Sign in popup was dismissed by the user.');
      return {
        success: false,
        cancelled: true,
        errorCode: code,
        errorMessage: 'Sign-in window was closed. You can re-open it anytime or use the direct CSV/sheets.new options.',
      };
    }

    if (code === 'auth/popup-blocked') {
      console.warn('Google Sign in popup blocked by browser policy.');
      return {
        success: false,
        errorCode: code,
        errorMessage: 'Pop-up window was blocked by your browser. Please allow popups for this site and retry.',
      };
    }

    if (code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      console.warn('Firebase Auth unauthorized domain:', error?.message);
      return {
        success: false,
        errorCode: 'auth/unauthorized-domain',
        errorMessage: 'This preview domain is awaiting authorization in Firebase. Use the instant sheets.new or CSV export options below.',
      };
    }

    console.warn('Google Sign in unexpected issue:', error?.message || error);
    return {
      success: false,
      errorCode: code,
      errorMessage: error?.message || 'Google sign-in could not be completed.',
    };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates and formats a new Google Sheet containing the Confusion Matrix
 * (15 test images per denomination = 45 total test samples)
 * using the Google Sheets REST API v4.
 */
export async function exportConfusionMatrixToGoogleSheets(
  accessToken: string,
  result: ConfusionTable15Result
): Promise<SheetCreationResult> {
  // 1. Create a new Spreadsheet
  const title = `CFA Franc Coins - Confusion Matrix (${new Date().toISOString().split('T')[0]})`;

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Confusion Matrix & Test Log',
            gridProperties: {
              rowCount: 70,
              columnCount: 12,
              frozenRowCount: 7,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errorText}`);
  }

  const createdSheet = await createRes.json();
  const spreadsheetId = createdSheet.spreadsheetId;
  const sheetId = createdSheet.sheets[0]?.properties?.sheetId ?? 0;

  // 2. Build rows data
  const values = buildGoogleSheetsConfusionData(result);

  // 3. Write data to sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Confusion Matrix & Test Log'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'Confusion Matrix & Test Log'!A1",
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Failed to write values to sheet: ${errorText}`);
  }

  // 4. Batch format styling: Bold headers, green diagonal highlights, borders, column widths
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Bold & enlarge main title in A1
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.1, green: 0.15, blue: 0.25 },
                  textFormat: {
                    bold: true,
                    fontSize: 13,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Format Confusion Matrix header row (Row 8, index 7)
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 7,
                endRowIndex: 8,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.95, green: 0.75, blue: 0.2 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Highlight diagonal true positive cells in green (Row indices 8, 9, 10)
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 8,
                endRowIndex: 9,
                startColumnIndex: 1,
                endColumnIndex: 2,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.85, green: 0.96, blue: 0.88 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 9,
                endRowIndex: 10,
                startColumnIndex: 2,
                endColumnIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.85, green: 0.96, blue: 0.88 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 10,
                endRowIndex: 11,
                startColumnIndex: 3,
                endColumnIndex: 4,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.85, green: 0.96, blue: 0.88 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Adjust column A width for readability
          {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 1,
              },
              properties: {
                pixelSize: 240,
              },
              fields: 'pixelSize',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Batch styling warning (data intact):', err);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    title,
  };
}
