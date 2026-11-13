# 🚀 MasterWave Music - GitHub Release Guide

To publish your release and APK/distribution package to the **GitHub Releases** section of your repository (`https://github.com/mahesh2008here-star/Master-music`), follow these simple terminal steps:

### Step 1: Connect your local repository to GitHub
Open your terminal in the project directory and run:
```bash
git remote add origin https://github.com/mahesh2008here-star/Master-music.git
git branch -M main
git push -u origin main
```

### Step 2: Create and push a Release Tag (`v1.0.0`)
Our automated GitHub Actions workflow (`.github/workflows/release.yml`) listens for version tags starting with `v` (such as `v1.0.0`). When you push a tag, GitHub automatically builds the application and publishes it to your **Releases** tab with the compiled distribution package attached!

Run:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Step 3: View your Release
Once pushed, go to:
`https://github.com/mahesh2008here-star/Master-music/releases`

You will see your official `v1.0.0` release published with the built release archive attached automatically by GitHub Actions!
