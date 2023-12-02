const express = require('express')
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const jwt_secret = "sdjkfhndjkfmndkfjiuhrfuejrejkr3e343"

const mongoUrl = "mongodb+srv://chebroluvarsha:varsha123@cluster0.4x7cpjj.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoUrl,{
    // useNewUrlParser: true,
})
.then(()=>{
    console.log("connected to database");
})
.catch((e)=>{
    console.log("hi")
    console.log(e);
})

app.listen(5000,()=>{
    console.log("Server started");
})

app.post("/post",async(req,res)=>{
    console.log(req.body);
});

require("./userDetails");

const User = mongoose.model("UserInfo");

app.post("/register",async(req,res)=>{
    const {fname,lname,email,password} = req.body;

    const encryptedPassword = await bcrypt.hash(password,10);
    try{
        const oldUser = await User.findOne({email});

        if(oldUser){
           return res.send({error:"User Exists"});
        }
        await User.create({
            fname,
            lname,
            email,
            password:encryptedPassword,
        });
        res.send({status:"ok"});
    } catch(error){
        res.send({status:"error"})
    }
});

app.post("/login-user",async(req,res)=>{
    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user){
        return res.send({error: "User Not Found"});
    }

    if(await bcrypt.compare(password,user.password)){
        const token = jwt.sign({email:user.email},jwt_secret,{
            expiresIn: 10,
        });
        
        if(res.status(201)){
            return res.json({status: "ok",data:token});
        }
        else{
            return res.json({error:"error"});
        }
    }

    res.json({status:"error",error:"Invalid password"});

})

app.post("/userData",async(req,res)=>{
    const {token} = req.body;
    try {
      const user = jwt.verify(token,jwt_secret,(err,res)=>{
        if(err){
            return "token expired";
        }
        return res;
      });
      if(user=="token expired"){
        return res.send({status:"error",data: "token expired"});
      }
      const useremail = user.email;
      User.findOne({email:useremail}).then((data)=>{
        res.send({status:"ok",data:data});
      })
      .catch((error)=>{
        res.send({status:"error",data:error});
      })
    } catch (error) {
      
    }
  })

app.post("/forgot-password",async(req,res)=>{
    const {email} = req.body;
    try {

        const oldUser = await User.findOne({email});
        if(!oldUser){
            return res.json({status: "User Not Exists"});
        }
        const secret = jwt_secret + oldUser.password;
        const token = jwt.sign({email: oldUser.email, id:oldUser._id},secret,{
            expiresIn: "5m",
        });
        const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
        console.log(link);
        
    } catch (error) {
        
    }

});

app.get("/reset-password/:id/:token",async(req,res)=>{
    const {id,token} = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id:id});
        if(!oldUser){
            return res.json({status: "User Not Exists"});
        }
        const secret = jwt_secret + oldUser.password;
        try {
            const verify = jwt.verify(token,secret);
            return res.send("Verified");
        } catch (error) {
            return res.send("Not Verified");
        }
    
});