export const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试扫码</title>
  <style>
    button{
      padding: 5px 10px;
    }
  </style>
</head>
<body>
  <div>
    <input id="input" /> <button id="qr">扫码</button>
  </div>
  <script>
    (function(){
      let qrButton = document.querySelector("#qr");
      let input = document.querySelector("#input")
      qrButton.addEventListener('click', ()=>{
        window.qfCustomJsApi.barCodeScan({
          barCodeTypes: ['ean13', 'ean8', 'upc_a', 'qr', 'code128'],
          success: (res) =>{
            input.value = res.data
          },
          fail: (err)=>{
            alert(JSON.stringify(err))
          }
        })
      }, false)
    })();
  </script>
</body>
</html>`;

//aztec
// ['aztec',
// 'codabar',
// 'code39',
// 'code93',
// 'code128',
// 'code39mod43',
// 'datamatrix',
// 'ean13',
// 'ean8',
// 'interleaved2of5',
// 'itf14',
// 'maxicode',
// 'pdf417',
// 'rss14',
// 'rssexpanded',
// 'upc_a',
// 'upc_e',
// 'upc_ean',
// 'qr']
