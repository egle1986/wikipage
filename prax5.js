//impordib library'd
const http = require('http'),
      url = require('url'),
      fs = require('fs');

//lehe loomiseks kasutatav template
const tmpl = `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" /> 
    </head>
    <body>
        <div class='content'>
            %content%
        </div>
        <hr>
        <div class='editform'>
            <form method='get' action='/edit'>
                <textarea name='data'>%content%</textarea>
                <input type='submit' />
            </form>
        </div>
    </body>
</html>
`
//funktsioon failide lugemiseks - Promise annab kaasa võimaluse, et saad kaasa anda funktsioonile .then, kaks funkts mis vastavalt sellele, kas promise'i töö õnnestus või ebaõnnestus jooksevad 
const readF = function (path) {
    return new Promise(function (res,rej) {
        fs.readFile(path, 'utf8', function (err,data) {
            if(err) {
                rej(err);
                return;
            }
            res(data);
        });
    });
}

//funktsioon failide kirjutamiseks
const writeF = function (path, data) {
    return new Promise(function (res,rej) {
        fs.writeFile(path, data, 'utf8', function (err){
            if(err) {
                rej(err);
                return;
            }
            res();
        });
    });
}

//renderdab template'st lehe, võetud http://stackoverflow.com/a/7975025/2382113
const renderPage = function (template, content) {
    return new Promise(function (res,rej) {
        //replace funkts asendab stirngis olevad tekstid, mis on replacements võtme, võtme taga oleva väärtusega
        var replacements = {
            '%content%': content
        }
        template = template.replace(/%\w+%/g, function(all) {
            return replacements[all] || all;
        });
        res(template);
    });
}

//vastab serverile saadetud päringutele
var server = http.createServer(function (req,res) {
    var uri = url.parse(req.url, true);
    //testib, kas päring tehti edit-url'i pihta
    if(/edit/.test(uri.pathname)){
        //testib kas brauser saatis andmeid serverile, kui jah, siis üritame andmeid faili kirjutada
        if(!!uri.query.data){
            writeF('wiki.html', uri.query.data).then(function () {
                res.writeHead(302, {'Location': '/'}); //kui õnnestus, siis saadab tagasi http koodi 302-redirect
                res.end();
            }, function (err){
                res.writeHead(500, {'Content-Type': 'text/plain'}); //kui ei õnnestunud, siis http kood 500-server feilis
                res.write(`${err}`);
                res.end();
            });
        //brauser ei saatnud uut lehesisu
        } else {
            res.writeHead(400, {'Content-Type': 'text/plain'}); //http kood 400-bad request
            res.write('Browser didn\'t provide text to write');
            res.end();
        }
        return;
    }
    //saadab tagasi wiki-lehe brauserile
    res.writeHead(200, {'Content-Type': 'text/html'});
    readF('wiki.html').then(function (content) {
        //saadab tagasi renderdatud template'i wiki.html faili sisuga
        renderPage(tmpl, content).then(function (page) {
            res.write(page);
            res.end();
        });
    }, function (err) { //juhul kui faili lugemine ebaõnnestus, saadab tagasi renderdatud template'i vaikimisi tekstiga
        renderPage(tmpl, 'EDIT ME :/').then(function (page) {
            res.write(page);
            res.end();
        });
    });
});

//esimene argument määrab, mis pordi peal server jookseb
server.listen(8080, function () {console.log('Homework is running at http://dijkstra.cs.ttu.ee:8080/')});