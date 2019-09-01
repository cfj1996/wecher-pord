const koa = require('koa')
const Router = require('koa-router')
const request = require('request-promise')
const fs = require('fs')
const path = require('path')
const {AppID, appsecret} = require('./config.js')
const cors = require('koa2-cors');
const app = new koa()
let router = new Router()

app.use(cors({
    origin: function (ctx) {
        return "*";
    },
}))

fs.readFile(path.join(__dirname, './token.txt'), "utf-8", function (err, data) {
    if (err) {
        console.log("error")
    } else {
        if(data){
            data = JSON.parse(data)
            if(data.loadTime + data.expires_in-10 >= (new Date().getTime())/1000){
                console.log('未过期')
                return
            }
        }
        request({
            method: 'GET',
            json: true,
            url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${AppID}&secret=${appsecret}`
        })
            .then(res => {
                if (res['access_token']) {
                    res.loadTime = new Date().getTime()/1000
                    fs.writeFileSync(path.join(__dirname, './token.txt'), JSON.stringify(res))
                    console.log('获取token')
                }
                console.log(res)
            })
            .catch(error => {
                new Error(error+'微信请求token错误')
            })
    }
})

router.get('/getToken', async (ctx, next)=>{
    const code = ctx.request.query.code
    let res = await request(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${AppID}&secret=${appsecret}&code=${code}&grant_type=authorization_code`)
    ctx.body = {
        code: 200,
        msg: 'ok'
    }
    await next()
})


app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)
