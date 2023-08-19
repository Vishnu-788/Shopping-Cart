var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')

const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  console.log(user)
  let cartCount = null
  if(user){
    cartCount = await userHelpers.getCartcount(user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount})
  })
});
router.get('/login',(req,res)=>{
if (req.session.loggedIn){
  res.redirect('/')
}else{
  res.render('user/login',{"loginerr":req.session.loginErr})
  req.session.loginErr = null
}
 
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response)
    req.session.loggedIn=true
    req.session.user = response
    res.redirect('/')
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    //This is for creating a session for the user
    if(response.status){
      req.session.loggedIn=true
      req.session.user = response.user
      res.redirect('/')
    }else{
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{products,user:req.session.user._id,total})
})

router.get("/add-to-cart/:id",verifyLogin,(req,res)=>{
  console.log("API call")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res)=>{
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async()=>{
    let total = await userHelpers.getTotalAmount(req.body.user)
    resObject ={
      count:req.body.count,
      proId:req.body.product,
      total
    }
     res.json(resObject)
  })
})
router.get("/remove-item",(req,res)=>{
  userHelpers.removeButton(req.query,req.session.user._id).then(()=>{
    res.send("Item removed")
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  console.log(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total})
})


module.exports = router;
