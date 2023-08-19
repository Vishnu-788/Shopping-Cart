function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/' + proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = $('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            } 
        }
    })
}

function removeButton(proId,userId){
    console.log('button call worked')
    console.log(proId)
    $.ajax({
        url:"/remove-item",
        data:{
            productId:proId,
            user:userId
        },
        method:'get',
        success: (response) => {
            let id = 'product-' + proId
            // Handle the response on success
            document.getElementById('total').innerHTML= response.total
            document.getElementById(id).remove();
            alert('Item removed');
        },
        error: (xhr, status, error) => {
            // Handle errors here
            console.error("Error:", error);
        }
    })
} 
