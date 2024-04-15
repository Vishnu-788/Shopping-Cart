var db = require('../config/connection')
const collections = require('../config/collections')
var objectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt')
module.exports = {
    addProduct:(product,callback)=>{
        console.log(product)
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data)
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProducts:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetail:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Category:proDetails.Category,
                    Price:proDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    doLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let response ={}
            let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    console.log(status);
                    if(status){
                        console.log("Login success")
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    }else{
                        console.log("Login failed")
                        resolve({status:false})
                    }
                })
            }else{
                console.log("NOt admin");
                resolve({status:false})
            }
        })

    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collections.USER_COLLECTION).aggregate([
                {
                    $match:{}
                },
                {
                    $lookup:
                    {
                        from:collections.ORDER_COLLECTION,
                        localField:'_id',
                        foreignField:'userId',
                        as:'orders'
                    }
                },
                {
                    $addFields:
                    {   
                        orderCount:{ $size : '$orders'}
                    }
                },
                {
                    $project:
                    {
                        Name:'$Name',
                        Email:'$Email',
                        orderCount:'$orderCount',
                        placedOrders:{
                            $size:{
                                $filter:{
                                    input:'$orders',
                                    as:'order',
                                    cond:{$eq:['$$order.status','placed']}
                                }
                            }
                        },
                        unplacedOrders:{
                            $size:{
                                $filter:{
                                    input:'$orders',
                                    as:'order',
                                    cond:{$eq:['$$order.status','payment']}
                                }
                            }
                        }

                    }
                }
            ]).toArray().then((users)=>{
                resolve(users)
            }).catch((error)=>{
                console.log(error);
                reject(error)
            })
        })
    },
    getAllOrderHistory:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{}
                },
                {
                    $lookup:
                    {
                        from:collections.USER_COLLECTION,
                        localField:'userId',
                        foreignField:'_id',
                        as:'user'
                    }
                },
                {
                    $project:
                    {
                        userName:'$user.Name',
                        delivaryDetails:1,
                        paymentMethod:1,
                        products:1,
                        totalAmount:1,
                        status:1,
                        date:1
                    }
                }
            ]).toArray().then((orderHistory)=>{
                console.log(orderHistory);
                resolve(orderHistory)
            }).catch((error)=>{
                reject(error)
            })
        })
    }
}