# Images

- `banner-dark.png` and `banner-light.png` (2560 × 640) are the banner at the top of the README, in dark and light.
- `social-preview.png` (1280 × 640) is the image GitHub shows when the repository is linked elsewhere. GitHub does not read it from this folder: it is uploaded by hand in the repository's Settings, under Social preview. Remake and upload it again whenever the banner changes.

`social-preview.png` is made from `banner-dark.png` with ImageMagick: cut 44 px from each side and scale it to 1280 px wide, then center it on a 1280 × 640 background made from the banner's top and bottom 120 px rows, with the top and bottom 60 px of the banner faded into that background.

```sh
magick banner-dark.png -crop 2560x120+0+0 +repage -resize '1280x320!' top.png
magick banner-dark.png -crop 2560x120+0+520 +repage -resize '1280x320!' bottom.png
magick top.png bottom.png -append -blur 0x20 background.png
magick banner-dark.png -crop 2176x640+44+0 +repage -resize 1280x banner.png
magick -size 1280x376 xc:white \( -size 1280x60 gradient:black-white \) -gravity north -composite \( -size 1280x60 gradient:white-black \) -gravity south -composite mask.png
magick banner.png mask.png -alpha off -compose copy-opacity -composite banner-faded.png
magick background.png banner-faded.png -gravity center -compose over -composite -strip social-preview.png
rm top.png bottom.png background.png banner.png mask.png banner-faded.png
```
