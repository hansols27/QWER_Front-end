import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="ko"> 
        <Head>          
          <link rel="icon" href="/favicon.ico" />
          <link href='https://jyplevel2storage01.blob.core.windows.net/system/SpoqaHanSans-kr.css' rel='stylesheet' type='text/css' />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat+Subrayada:wght@700&family=Montserrat:wght@700&display=swap" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;