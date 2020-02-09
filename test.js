const cheerio = require('cheerio')
const html = `
<ul>
  <li>Hello A</li>
  <li>Hello B</li>
  <li>Hello C</li>
</ul>
`
const a = cheerio.load(html)

function parse (input) {
  console.log("hi"+input)
  return Promise.resolve("hihello")

}

console.log(a.html())

Promise.all(
  cheerio
  .load(html)("li")
    .each((i,el) => parse(a(el).html()))

).then(intros => {
return intros
}).then(output=>
{
  console.log(output)
})
