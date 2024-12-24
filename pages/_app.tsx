import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { getLanguage, translations } from '../locales/translations'
import '../styles/globals.css'

const theme = createTheme()

export default function App({ Component, pageProps }: AppProps) {
  const [lang, setLang] = useState<'en' | 'zh'>('en')

  useEffect(() => {
    setLang(getLanguage())
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <meta name="description" content={translations[lang].description} />
        <meta name="keywords" content={translations[lang].keywords} />
      </Head>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
