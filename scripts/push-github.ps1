
# Upload to GitHub

# Configure remote
if (git remote | Select-String "origin") {
    git remote remove origin
}
git remote add origin https://github.com/Sergiocharata1977/SIG-Agro.git

# Add files
git add .

# Commit
git commit -m "feat: Implementation of Advanced Crops, Dashboard, and IA Analysis"

# Rename branch to main
git branch -M main

# Push
git push -u origin main
