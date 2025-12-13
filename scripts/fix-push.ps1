
# Undo last commit but keep changes staged
git reset --soft HEAD^

# Unstage the secret file
git reset HEAD service-account.json

# Add to gitignore
Add-Content .gitignore "`nservice-account.json"

# Add gitignore to staging
git add .gitignore

# Commit again (without the secret)
git commit -m "feat: Implementation of Advanced Crops, Dashboard, and IA Analysis"

# Push
git push -u origin main
