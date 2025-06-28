# FFMPEG Installation Guide

This application requires **FFMPEG** for video processing and screenshot generation. Follow the installation instructions for your operating system.

## 📋 Installation Instructions

### **macOS**

#### Option 1: Using Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install FFMPEG
brew install ffmpeg
```

#### Option 2: Using MacPorts
```bash
# Install FFMPEG with MacPorts
sudo port install ffmpeg
```

### **Ubuntu/Debian Linux**

```bash
# Update package list
sudo apt update

# Install FFMPEG
sudo apt install ffmpeg

# For older Ubuntu versions, you might need:
sudo apt install software-properties-common
sudo add-apt-repository ppa:jonathonf/ffmpeg-4
sudo apt update
sudo apt install ffmpeg
```

### **CentOS/RHEL/Fedora**

#### CentOS/RHEL 8+
```bash
# Enable EPEL repository
sudo dnf install epel-release

# Install FFMPEG
sudo dnf install ffmpeg ffmpeg-devel
```

#### Fedora
```bash
# Install FFMPEG
sudo dnf install ffmpeg ffmpeg-devel
```

### **Windows**

#### Option 1: Using Chocolatey (Recommended)
```powershell
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install FFMPEG
choco install ffmpeg
```

#### Option 2: Manual Installation
1. Download FFMPEG from [https://ffmpeg.org/download.html#build-windows](https://ffmpeg.org/download.html#build-windows)
2. Extract the archive to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH environment variable
4. Restart your command prompt/terminal

### **Docker**

If running in Docker, add this to your Dockerfile:

```dockerfile
# For Alpine Linux
RUN apk add --no-cache ffmpeg

# For Ubuntu-based images
RUN apt-get update && apt-get install -y ffmpeg
```

## ✅ Verify Installation

After installation, verify FFMPEG is working:

```bash
ffmpeg -version
```

You should see output similar to:
```
ffmpeg version 4.4.2 Copyright (c) 2000-2021 the FFmpeg developers
built with gcc 9 (Ubuntu 9.4.0-1ubuntu1~20.04.1)
configuration: --prefix=/usr --extra-version=0ubuntu0.20.04.1 --toolchain=hardened...
```

## 🔧 Application Configuration

The application uses FFMPEG for:

- **Video Metadata Extraction**: Getting duration, frame rate, and resolution
- **Screenshot Generation**: Extracting frames at specified intervals
- **Format Validation**: Ensuring uploaded files are valid video formats

### Default Settings:
- **Screenshot Interval**: 60 seconds (60,000ms)
- **Screenshot Format**: JPG
- **Quality**: High quality (`-q:v 2`)
- **Processing**: Background/Asynchronous

### Configurable Parameters:
- `pulse`: Screenshot interval in milliseconds (100ms - 300,000ms)
- Video upload limit: 1GB
- Supported formats: All video formats supported by FFMPEG

## 🚨 Troubleshooting

### Command Not Found
If you get "ffmpeg: command not found":
1. Ensure FFMPEG is installed
2. Check if it's in your system PATH
3. Restart your terminal/application
4. Try using full path: `/usr/local/bin/ffmpeg`

### Permission Errors
```bash
# Make sure FFMPEG has execute permissions
chmod +x /usr/local/bin/ffmpeg
```

### Performance Issues
For better performance on servers:
```bash
# Install FFMPEG with additional codecs
sudo apt install ffmpeg libavcodec-extra
```

## 📈 Performance Notes

- Screenshot generation runs in background to avoid blocking API responses
- Multiple video uploads are processed concurrently
- Failed screenshots don't stop the overall process (partial success allowed)
- Temporary files are cleaned up automatically

---

**Need Help?** If you encounter issues, check the application logs for detailed FFMPEG error messages. 