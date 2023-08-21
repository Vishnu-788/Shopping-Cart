var db = require('../config/connection')
const collections = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID


module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password = await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
                console.log("Data" + data)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("Login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else{
                        console.log("Login failed")
                        resolve({status:false})
                    }
                })
            }else{
                console.log("User not Found")
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj = {
            item:objectId(proId),
            quantity:1

        }
        return new Promise( async (resolve,reject)=>{
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist)
                if(proExist != -1){
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then((response)=>{
                        resolve();
                    })
                }else{
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne({user:objectId(userId)},
                    {
                    
                        $push:{products:proObj}
                        
                    }
                    ).then((response)=>{
                        resolve();
                    })
                }
             
            }else{
                let cartObj = {
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise( async (resolve,reject)=>{
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
               {
                  $match:{user:objectId(userId)}
               },
               {
                $unwind:'$products'
               },
               {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
               },
               {
                $lookup:{
                    from:collections.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'products'
                }
               },
               {
                $project:{
                    item:1,
                    quantity:1,
                    product: { $arrayElemAt: ["$products",0]}
                }
               }
             
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartcount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                 count = cart.products.length
            }else{
                count=0
            }
            resolve(count)
        })
    },
    changeProductQuantity:((details)=>{
        details.count = parseInt(details.count)
        return new Promise ((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }).then(()=>{
                resolve();
            })
           
        })
    }),
    removeButton:(data)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({user:objectId(data.user)},
            {
                $pull:{ products : {item : objectId(data.productId)} }
            }).then((response)=>{
                resolve();
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise( async (resolve,reject)=>{
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
               {
                  $match:{user:objectId(userId)}
               },
               {
                $unwind:'$products'
               },
               {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
               },
               {
                $lookup:{
                    from:collections.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'products'
                }
               },
               {
                $project:{
                    item:1,
                    quantity:1,
                    product: { $arrayElemAt: ["$products",0]}
                }
               },
              {
                $group:
                {
                    _id:null,
                    total:{$sum:{$multiply:['$quantity','$product.Price']}}
                }
              }
            ]).toArray()
            console.log(total)
            resolve(total[0].total)
        })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            let status = order['payment-method'] === 'COD'?'placed':'payment'
            let ordObj = {
                deliveryDetails:{
                    mobile:order.Mobile,
                    address:order.Address,
                    pinCode:order.Pincode
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                data:new Date()
            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(ordObj).then(()=>{
                db.get().collection(collections.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                resolve()
            })
        }).catch((error)=>{
           reject(error)
            
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getcartOrdersHistory:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:
                    {
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:
                    {
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:
                    {
                        quantity:1,
                        products:1

                    }
                }

            ]).toArray()
            resolve(products)
        })
       
    }
}