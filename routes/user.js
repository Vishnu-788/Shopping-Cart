var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')

const verifyLogin = (req,res,next)=>{
  if(req.session.user.loggedIn){
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
if (req.session.user){
  res.redirect('/')
}else{
  res.render('user/login',{"loginerr":req.session.userLoginErr})
  req.session.userLoginErr = null
}
 
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    req.session.user = response
    req.session.user.loggedIn=true
    res.redirect('/')
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    //This is for creating a session for the user
    if(response.status){
      req.session.user = response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }else{
      req.session.userLoginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = 0
  if(products.length > 0){
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }
  res.render('user/cart',{products,user:req.session.user._id,total})
})

router.get("/add-to-cart/:id",verifyLogin,(req,res)=>{
  console.log("API call")
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res)=>{
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
  userHelpers.removeButton(req.query).then(async()=>{
    let total = await userHelpers.getTotalAmount(req.query.user)
    console.log(total)
   res.json({total})
    
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  console.log(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user: req.session.user})
})

router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getCartProductList(req.body.userId)
  let total = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,products,total).then((orderId)=>{
    if(req.body['payment-method'] == 'COD'){
      console.log("Ifcase worked");
      res.json({codSuccess:true,total})
      
    }else{
      userHelpers.generateRazorpay(orderId,total).then((response)=>{
        res.json(response)
      })
    }
    

  }).catch((error)=>{
    console.log(error)
    console.log("Error in the route");
  })
})

router.get('/order-success',(req,res)=>{
  res.render('user/success',{user:req.session.user})
})

router.get('/orders',async(req,res)=>{
  let orders = await userHelpers.getcartOrdersHistory(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
  
})
router.get('/view-order-product/:id',async(req,res)=>{
  let orderId = req.params.id
  let products = await userHelpers.getOrderProducts(orderId)
  console.log(products);
  res.render('user/orderedProducts',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment success");
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false})
  })
})

module.exports = router;
