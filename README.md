# NT Docs

## Local preview

Using docker / podman to build and serve is fairly straight forward:

```
docker build --tag nt-docs -f Containerfile . && docker run -p 80:80 -it --name nt-docs --rm nt-docs
```

If you wish to properly date a content item for the future, such as when drafting
a blog post, you can change the `Containerfile` or your local `hugo` command to
include `-D --buildDrafts` and `-F --buildFuture` so
`hugo --buildDrafts --buildFuture --logLevel info` instead of `hugo --logLevel info`.


## Use your own templates

If you need to replace the footer, navigation, header, etc., create a file in the repository 
root `/layouts/partials/` with the same name as `/themes/docs/layouts/partials/*`.
It will take higher priority and be used first from the root layouts.

## Use in your repository

Your repository should contain a [config.toml](config.toml.example) you should commit along with your custom
as your custom `/layouts/partial/`.

In your `config.toml`, you can configure:

### Color scheme:
```
[params.theme.colors]
  primary = "#15357f" # home page h1, primary buttons
  secondary = "#f5821f" # secondary button
  link = "#1d71d3" # link colors
  footer = "#052569" # footer background color
```

### Parameters:
```
[params]
  branch = "master" # branch that used in the Suggest change button
  repositoryUrl = "https://github.com/cfengine/documentation" # repository that used in the Suggest change button
  domain = "docs.northern.tech" # domain used in meta property="og:url", in the header
```
### Images

You need to places some images in your repository (`/static/`):
 - `favicon.svg`
 - `doc-logo-full-color.svg` - header logo
 - `doc-logo-inverted.svg` - footer logo
 - `default_social_preview.png` - default image for social networks preview
 