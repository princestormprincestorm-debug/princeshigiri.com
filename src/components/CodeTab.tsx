import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  FolderTree,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const CodeTab: React.FC = () => {
  const [activeSnippet, setActiveSnippet] = useState<'extract' | 'train' | 'infer' | 'reqs'>('train');
  const [copied, setCopied] = useState<boolean>(false);

  const snippets = {
    extract: `# =====================================================================
# Central African CFA Franc Coins - PDF Image Extractor & Dataset Split
# Extracts 60 images (20x 100 FCFA, 20x 250 FCFA, 20x 500 FCFA)
# Creates 80% train / 20% validation directory structure
# =====================================================================

import os
import io
import shutil
from PIL import Image

# Option A: Fast vector/raster image extraction using PyMuPDF (fitz)
# pip install pymupdf
try:
    import fitz  # PyMuPDF
    USE_FITZ = True
except ImportError:
    USE_FITZ = False
    from pdf2image import convert_from_path

PDF_PATH = "central_african_cfa_franc_coins.pdf"
DATASET_DIR = "dataset"

classes = ["100_fcfa", "250_fcfa", "500_fcfa"]

# 1. Create target folder hierarchy
for split in ["train", "val"]:
    for label in classes:
        os.makedirs(os.path.join(DATASET_DIR, split, label), exist_ok=True)

print("Extracting coin images from PDF...")

extracted_images = []

if USE_FITZ:
    doc = fitz.open(PDF_PATH)
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        image_list = page.get_images(full=True)
        for img_info in image_list:
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            extracted_images.append(image)
else:
    # Option B: Render pages at 200 DPI
    pages = convert_from_path(PDF_PATH, dpi=200)
    # If coins are arranged in a grid, crop each coin or extract page segments
    extracted_images = pages

# Validation indices: 4 per class (20% of 20 = 4 images)
val_indices = {4, 8, 12, 16, 24, 28, 32, 36, 44, 48, 52, 56}

for idx, img in enumerate(extracted_images[:60], start=1):
    if idx <= 20:
        label = "100_fcfa"
    elif idx <= 40:
        label = "250_fcfa"
    else:
        label = "500_fcfa"

    split = "val" if idx in val_indices else "train"
    target_path = os.path.join(DATASET_DIR, split, label, f"coin_{idx:02d}.jpg")
    img.save(target_path, "JPEG", quality=95)
    print(f"Saved: {target_path}")

print("Dataset successfully extracted and partitioned!")
`,

    train: `# =====================================================================
# PyTorch Transfer Learning: Central African CFA Franc Coin Classifier
# Backbone: Pretrained ResNet-18 / MobileNetV3
# Heavy Data Augmentation with 180° Rotation Invariance
# =====================================================================

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader

# 1. Device configuration
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using compute device: {device}")

# 2. Heavy Data Augmentation to prevent overfitting on 60 images
# Rotation Invariance: Coins can appear at any orientation!
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomRotation(degrees=180),  # Critical: Coins have no canonical angle
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
}

data_dir = 'dataset'
image_datasets = {
    x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
    for x in ['train', 'val']
}

dataloaders = {
    x: DataLoader(image_datasets[x], batch_size=8, shuffle=True, num_workers=2)
    for x in ['train', 'val']
}
dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'val']}
class_names = image_datasets['train'].classes
print(f"Classes ({len(class_names)}): {class_names}")
print(f"Training samples: {dataset_sizes['train']} | Validation samples: {dataset_sizes['val']}")

# 3. Model Definition: Pretrained ResNet-18
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

# Freeze lower convolutional layers to preserve low-level edge features
for param in model.parameters():
    param.requires_grad = False

# Replace classification head for 3 CEMAC denominations (100, 250, 500 FCFA)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Linear(num_ftrs, 128),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(128, len(class_names))
)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

# 4. Training Loop
num_epochs = 20
best_acc = 0.0

for epoch in range(num_epochs):
    for phase in ['train', 'val']:
        if phase == 'train':
            model.train()
        else:
            model.eval()

        running_loss = 0.0
        running_corrects = 0

        for inputs, labels in dataloaders[phase]:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()

            with torch.set_grad_enabled(phase == 'train'):
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                loss = criterion(outputs, labels)

                if phase == 'train':
                    loss.backward()
                    optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)

        if phase == 'train':
            scheduler.step()

        epoch_loss = running_loss / dataset_sizes[phase]
        epoch_acc = running_corrects.double() / dataset_sizes[phase]

        print(f"Epoch {epoch+1:02d}/{num_epochs:02d} [{phase.upper()}] Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

# 5. Save model weights for production inference
torch.save(model.state_dict(), "cfa_coin_classifier.pth")
print("Saved fine-tuned weights to cfa_coin_classifier.pth")
`,

    infer: `# =====================================================================
# Central African CFA Franc Coin - Inference / Prediction Script
# Loads trained ResNet-18 weights and classifies any input coin image
# =====================================================================

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

def load_coin_model(model_path="cfa_coin_classifier.pth", device=None):
    if device is None:
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    model = models.resnet18()
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 128),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(128, 3)
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model, device

def predict_coin(image_path, model_path="cfa_coin_classifier.pth"):
    model, device = load_coin_model(model_path)
    class_names = ['100_fcfa', '250_fcfa', '500_fcfa']

    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    img = Image.open(image_path).convert("RGB")
    tensor = preprocess(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, pred_idx = torch.max(probabilities, 0)

    predicted_label = class_names[pred_idx]
    conf_pct = confidence.item() * 100

    print(f"--- Inference Result ---")
    print(f"Predicted Denomination: {predicted_label.replace('_', ' ').upper()}")
    print(f"Confidence: {conf_pct:.2f}%")
    print(f"Probabilities: { {c: f'{p.item()*100:.1f}%' for c, p in zip(class_names, probabilities)} }")

    return predicted_label, conf_pct

if __name__ == "__main__":
    import sys
    test_image = sys.argv[1] if len(sys.argv) > 1 else "test_coin.jpg"
    predict_coin(test_image)
`,

    reqs: `# PyTorch Deep Learning & Computer Vision Stack
torch>=2.0.0
torchvision>=0.15.0
pillow>=10.0.0

# PDF Extraction Tooling
pdf2image>=1.16.3
pymupdf>=1.23.0

# Optional ONNX / Mobile Export
onnx>=1.14.0
onnxruntime>=1.15.0
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeSnippet === 'extract'
        ? 'extract_pdf.py'
        : activeSnippet === 'train'
        ? 'train_cfa_coins.py'
        : activeSnippet === 'infer'
        ? 'predict_coin.py'
        : 'requirements.txt';

    const blob = new Blob([snippets[activeSnippet]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Terminal className="w-3.5 h-3.5" />
            PyTorch & Python Pipeline Hub
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Code Generator & Export Center
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Production-ready scripts for PDF image extraction, Transfer Learning training loop with ResNet-18, and inference on Central African CFA Franc coins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 cursor-pointer flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download Script
          </button>
        </div>
      </div>

      {/* Code Browser Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSnippet('train')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSnippet === 'train'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              train_cfa_coins.py (PyTorch ResNet-18)
            </button>

            <button
              onClick={() => setActiveSnippet('extract')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSnippet === 'extract'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              extract_pdf.py (pdf2image & PyMuPDF)
            </button>

            <button
              onClick={() => setActiveSnippet('infer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSnippet === 'infer'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              predict_coin.py (Inference)
            </button>

            <button
              onClick={() => setActiveSnippet('reqs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                activeSnippet === 'reqs'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              requirements.txt
            </button>
          </div>

          <span className="text-xs font-mono text-slate-500">Python 3.10+ • PyTorch 2.x</span>
        </div>

        {/* Code Snippet Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            <code>{snippets[activeSnippet]}</code>
          </pre>
        </div>

        {/* Directory Structure Helper */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-2">
          <div className="font-semibold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-400" />
            Expected Directory Structure for PyTorch ImageFolder
          </div>
          <pre className="font-mono text-slate-400 text-[11px] leading-snug">
{`dataset/
├── train/
│   ├── 100_fcfa/  (16 images: coin_01.jpg .. coin_20.jpg excluding val)
│   ├── 250_fcfa/  (16 images: coin_21.jpg .. coin_40.jpg excluding val)
│   └── 500_fcfa/  (16 images: coin_41.jpg .. coin_60.jpg excluding val)
└── val/
    ├── 100_fcfa/  (4 images: coin_04, coin_08, coin_12, coin_16)
    ├── 250_fcfa/  (4 images: coin_24, coin_28, coin_32, coin_36)
    └── 500_fcfa/  (4 images: coin_44, coin_48, coin_52, coin_56)`}
          </pre>
        </div>
      </div>
    </div>
  );
};
