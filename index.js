const express=require("express")
const mongoose=require('mongoose')
const app=express();
const path=require('path');
const jwt=require("jsonwebtoken");
const cookieparser=require("cookie-parser")
const bcrypt=require("bcrypt");
const User=require("./model/user");
require('dotenv').config();

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));
app.use(cookieparser());

main()
.then((res)=>{
    console.log("DB successfully connected")
})
.catch((err)=>{
    console.log("DB connection failed")
})
async function main() {
    await mongoose.connect(process.env.MONGO_URI)
}

app.get('/signup',(req,res)=>{
    res.render("signup.ejs");
})
app.get('/login',(req,res)=>{
    res.render("login.ejs");
})

app.get('/',(req,res)=>{
    res.redirect("/signup");
})

app.get('/logout',(req,res)=>{
    res.clearCookie("token");
    res.redirect("/signup");
})

app.get('/dashboard',async(req,res)=>{
    let token=req.cookies.token;
    try {
    let data=await jwt.verify(token,process.env.SECRET_KEY);
    res.render("dashboard.ejs");
    } catch (error) {
        res.redirect("/signup")
    }
})

app.post('/signup',async(req,res)=>{
    let {username,password,age,email}=req.body;
    let hashPassword=await bcrypt.hash(password,10);
    let createdUser=await new User({
        username,
        age,
        email,
        password:hashPassword
    })
    createdUser.save()
    .then((result)=>{
    res.redirect("/login")
    })
    .catch((err)=>{
    res.send("Error while creating user")
    })

})

app.post('/login',async(req,res)=>{
    let {email,password}=req.body;
    let user=await User.findOne({email});

    if(!user){
       return res.send("Something went wrong please enter correct username or password")
    }
    let result=await bcrypt.compare(password,user.password);
    if(!result){
       return res.send("Something went wrong please enter correct username or password");
    }
    let token=await jwt.sign({email:user.email},process.env.SECRET_KEY);
    res.cookie("token",token);
    res.redirect("/dashboard");
})

app.listen(process.env.PORT,()=>{
    console.log("App is listening on port 3000");
})