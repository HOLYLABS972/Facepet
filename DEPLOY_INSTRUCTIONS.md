# 🚀 Deployment Instructions

## Option 1: Deploy via Git (Recommended)

On your server, run:
```bash
cd /home/chapiz-tag/htdocs/tag.chapiz.co.il

# If this is a Git repository, pull the latest code
git pull origin main  # or 'master', or your branch name

# Then build with Docker
docker-compose build --no-cache
docker-compose up -d
```

## Option 2: Copy Files from Local Machine

From your local machine (where you are now), run:

```bash
# Make sure you're in the project directory
cd /Users/admin/Documents/GitHub/Facepet

# Copy all files to server (excluding node_modules, .next, etc.)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude '.env*' --exclude '*.log' \
  ./ chapiz-tag@app:/home/chapiz-tag/htdocs/tag.chapiz.co.il/
```

Then on the server:
```bash
cd /home/chapiz-tag/htdocs/tag.chapiz.co.il
docker-compose build --no-cache
docker-compose up -d
```

## Option 3: Direct SCP Transfer

```bash
# From your local machine
cd /Users/admin/Documents/GitHub/Facepet
scp -r . chapiz-tag@app:/home/chapiz-tag/htdocs/tag.chapiz.co.il/
```

Then on server, same as Option 2.

## After Files Are on Server

1. **Ensure .env.production exists:**
```bash
cd /home/chapiz-tag/htdocs/tag.chapiz.co.il
ls -la .env.production
```

2. **Build and start Docker containers:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

3. **Check status:**
```bash
docker-compose ps
docker-compose logs -f nextjs
```

4. **Verify it's working:**
```bash
curl http://localhost/health
```

## Quick Check: Is Git Already Set Up?

On your server, run:
```bash
cd /home/chapiz-tag/htdocs/tag.chapiz.co.il
ls -la
```

If you see a `.git` folder, use **Option 1** (Git pull).
If not, use **Option 2** (rsync) or **Option 3** (SCP).
