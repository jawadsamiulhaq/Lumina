import { Helmet } from 'react-helmet-async'

const SITE = 'Lumina — Modern Store'

export function Seo({
  title,
  description,
  image,
}: {
  title?: string
  description?: string
  image?: string
}) {
  const fullTitle = title ? `${title} · ${SITE}` : SITE
  const desc = description ?? 'Shop premium electronics, apparel, home goods and more at Lumina.'
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
    </Helmet>
  )
}
