# Portfolio-Website

Source for [aaron-hong.com](https://aaron-hong.com). Plain static HTML: no build step, no dependencies. Upload the
folder as-is.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Home page: intro, experience timeline, and one section of cards per project |
| `Gameplay/`, `UI/`, `TechArt/`, `Cad/`, `ArtAnimation/`, `Other/` | One HTML file per write-up. These URLs are linked from resumes, so keep the file names |
| `assets/site.css` | The only stylesheet. Colours and fonts are variables at the top |
| `assets/site.js` | Lightbox, click-to-play YouTube, looping clips, light/dark toggle. Pages still work without it |
| `assets/fonts/` | Archivo and IBM Plex Mono, self-hosted (both SIL Open Font License) |
| `Pieces/` | Original, full-size files |
| `media/` | Web-sized copies of what's in `Pieces/` (WebP stills, MP4 loops made from the GIFs, video posters, home-page card thumbnails) |

## Editing a page

Each write-up is a list of chapters. A chapter is one or more rows of text beside media:

```html
<section class="chapter">
  <div class="row">
    <div class="row-text">
      <h2>Heading</h2>
      <p>Text.</p>
    </div>
    <div class="row-media">
      <div class="shots">
        <div class="shots-row">
          <figure class="shot" style="--ar:1.3333">
            <a href="../media/Cad/Example-1600.webp" data-lb data-orig="../Pieces/Cad/Example.png">
              <img src="../media/Cad/Example-960.webp" width="1600" height="1200" alt="Describe the image" loading="lazy">
            </a>
          </figure>
        </div>
      </div>
    </div>
  </div>
</section>
```

- Chapter numbers are added by CSS; there is nothing to renumber.
- `--ar` is the image's width divided by its height. Images in the same `shots-row` share the row and come out the
  same height. Add `solo` to a `shots-row` that holds a single image.
- `data-lb` opens the link in the lightbox; `data-orig` is the "Original file" link shown there.
- `row text-only` is a row with no media, `row stack` puts the media under the text at full width, and
  `shots wall` / `shots tiles` are the wrapping gallery layouts used on the art pages.
- A plain `<img src="../Pieces/...">` works too. The `srcset` variants only exist to keep pages light.

To add a write-up, copy the closest existing page, then add a card for it in `index.html` and fix the
previous / next links at the bottom of its neighbours.

## Making web-sized media

```sh
# still image -> 960px-wide WebP
magick Pieces/Cad/Example.png -resize 960x -quality 80 media/Cad/Example-960.webp

# GIF -> small looping MP4 plus a poster frame
ffmpeg -i Pieces/TechArt/GIF/Example.gif -movflags +faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 21 -an media/TechArt/GIF/Example.mp4
ffmpeg -i media/TechArt/GIF/Example.mp4 -frames:v 1 media/TechArt/GIF/Example-poster.webp
```
