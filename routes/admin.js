var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers');
var userHelpers = require('../helpers/user-helpers')
const { PRODUCT_COLLECTION } = require('../config/collections');


const verifyLogin = (req,res,next)=>{
  if(req.session.admin){
    next()
  }else{
    res.render('admin/login',{adminHeader:true})
  }
}
/* GET users listing. */
router.get('/', verifyLogin, function (req, res, next) {
  res.render('admin/index',{adminHeader:true,admin:req.session.admin})
});

router.get('/add-product', verifyLogin,function (req, res) {
  res.render('admin/add-product',{adminHeader:true})
})

router.post('/add-product',  (req, res) => {

  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err)
      }
    })
  })
})

router.get('/delete-product/:id',  verifyLogin, (req, res) => {
  let proId = req.params.id  // This will take the id from the urls that passed from the view_products. Prams is used to get that id from the URL
  productHelpers.deleteProducts(proId).then((response) => {
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',  verifyLogin, async (req, res) => {
  let product = await productHelpers.getProductDetail(req.params.id)
  console.log(product)
  res.render('admin/edit-products', { product })

})

router.post('/edit-product/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    let id = req.params.id
    res.redirect('/admin')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

router.get('/admin-login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/')
  } else {
    res.render('admin/login',{adminLoginErr:req.session.adminLoginErr})
    req.session.adminLoginErr = null
  }
})

router.post('/admin-login',(req,res)=>{
  productHelpers.doLogin(req.body).then((response)=>{
    console.log("Response",response);
    if(response.status){
      req.session.admin = response
      req.session.admin.loggedIn=true
      res.redirect('/admin')
    }else{
      req.session.adminLoginErr = "Invalid Username or Password"
      res.redirect('/admin/admin-login')
    }
  })
})

router.get('/get-all-products',(req,res)=>{
  productHelpers.getAllProducts().then((products) => {
    console.log(products)
    res.render('admin/view-products', { adminHeader: true , products ,admin:req.session.admin})
  })

})

router.get('/get-all-users',(req,res)=>{
  productHelpers.getAllUsers().then((users)=>{
    res.render('admin/show-users',{users,adminHeader:true}) 
  })
})

router.get('/get-order-history',(req,res)=>{
  productHelpers.getAllOrderHistory().then((orders)=>{
    res.render('admin/show-order-history',{adminHeader:true,orders})
  })
})

router.get('/view-order-product/:id',async(req,res)=>{
  let orderId = req.params.id
  let products = await userHelpers.getOrderProducts(orderId)
  console.log(products);
  res.render('user/orderedProducts',{adminHeader:true,products})
})
module.exports = router;
