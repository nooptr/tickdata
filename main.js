const https = require('https');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');

const writeFile = promisify(fs.writeFile);

async function getToken (symbol = "xauusd", year = "2019") {
  symbol = `${symbol}`.toLowerCase();
  const url = `https://www.histdata.com/download-free-forex-historical-data/?/metatrader/1-minute-bar-quotes/${symbol}/${year}`;

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // Xử lý dữ liệu để tìm giá trị của tk
    const tkMatch = data.match(/<input[^>]+id="tk"[^>]+value="([^"]+)"/);
    if (tkMatch && tkMatch[1]) {
      const tkValue = tkMatch[1];
      console.log('Giá trị tk:', tkValue);
      return tkValue;
    } else {
      console.log('Không tìm thấy giá trị tk.');
      return null;
    }

  } catch (error) {
    console.error('Lỗi:', error.message);
    throw error;
  }
}

async function downloadFile(tk, symbol, year) {
  symbol = `${symbol}`.toUpperCase();
  const postData = `tk=${tk}&date=${year}&datemonth=${year}&platform=MT&timeframe=M1&fxpair=${symbol}`;
  // console.log(postData);

  const options = {
    hostname: 'www.histdata.com',
    path: '/get.php',
    method: 'POST',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': 'cookielawinfo-checkbox-non-necessary=yes; viewed_cookie_policy=yes; cookielawinfo-checkbox-necessary=yes',
      'Origin': 'https://www.histdata.com',
      'Referer': 'https://www.histdata.com/download-free-forex-historical-data/?/metatrader/1-minute-bar-quotes/xauusd/2023',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    }
  };

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = [];

        res.on('data', (chunk) => {
          data.push(chunk);
        });

        res.on('end', () => {
          const buffer = Buffer.concat(data);
          resolve(buffer);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    });

    await writeFile(`HISTDATA_COM_MT_${symbol}_M1_${year}.zip`, response);
    console.log('File tải về thành công.');
  } catch (error) {
    console.error(`Lỗi: ${error.message}`);
  }
}

async function unzip(symbol, year) {
  const zipFilePath = `HISTDATA_COM_MT_${symbol}_M1_${year}.zip`;
  const outputDir = symbol;
  try {
    await new Promise((resolve, reject) => {
      exec(`unzip -n ${zipFilePath} -d ${outputDir}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Lỗi khi giải nén: ${error.message}`);
          reject(error);
        } else {
          console.log(`Giải nén hoàn tất: ${stdout}`);
          resolve(stdout);
        }
      });
    });
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

async function downloadAll(symbolList, yearList) {
  for (const symbol of symbolList) {
    console.log(symbol);
    for (const year of yearList) {
      console.log(year);
      const tk = await getToken(symbol, year);
      await downloadFile(tk, symbol, year);
    }
    console.log("");
  }
}

async function unzipAll(symbolList, yearList) {
  for (const symbol of symbolList) {
    console.log(symbol);
    for (const year of yearList) {
      console.log(year);
      await unzip(symbol, year);
    }
    console.log("");
  }
}

(async() => {
  // const tk = await getToken("xauusd", "2023");
  // console.log(tk);
  // await downloadFile(tk, "XAUUSD", "2023");

  const yearList = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  const symbolList = [
    "XAUUSD",
    "GBPUSD",
    "AUDCAD",
    "EURUSD",
  ];
  // await downloadAll(symbolList, yearList);
  await unzipAll(symbolList, yearList);
})();
