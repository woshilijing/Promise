class Promise{
    constructor(executor){
        this.status="pending";
        this.value="undefined";
        this.reason="undefined";
        this.onResolvedCallbacks=[];
        this.onRejectedCallbacks=[];
        let resolve=(value)=>{
            this.value=value;
            this.status="fulfilled";
            this.onResolvedCallbacks.forEach(fn=>fn());
          /*  this.onResolvedCallbacks.forEach(fn=>{
                fn(this.value);
            })*/
        };
        let reject=(reason)=>{
            this.reason=reason;
            this.status='rejected'
            this.onRejectedCallbacks.forEach(fn=>fn());
           /* this.onRejectedCallbacks.forEach(fn=>{
                fn(this.value);
            })*/
        };
        try{
            executor(resolve,reject);
        }catch{
            reject(e)
        }
    }
    then(onFulfilled,onRejected){
        onFulfilled=typeof onFulfilled==="function"?onFulfilled:data=>data;
        onRejected=typeof onRejected==="function"?onRejected:err=>{
            throw err
        };
        let promise2;//每次调用then返回新的promise，实现链式调用主要靠这个
        promise2=new Promise((resolve,reject)=>{
            if(this.status==="fulfilled"){
                setTimeout(()=>{//为了拿到promise2需要异步执行
                    try{//如果onFulfilled执行失败，则执行下一个promise的reject
                        let x=onFulfilled(this.value);
                        resolvePromise(promise2,x,resolve,reject);
                    }catch (e) {
                        reject(e);
                    }

                },0)

            }
            if(this.status==="rejected"){
                setTimeout(()=>{
                    try{
                        let x=onRejected(this.reason);
                        resolvePromise(promise2,x,resolve,reject);
                    }catch (e) {
                        reject(e);
                    }
                },0)

            }
            if(this.status==="pending"){
                 this.onResolvedCallbacks.push(()=>{
                     setTimeout(()=>{
                         try{
                             let x=onFulfilled(this.value);
                             resolvePromise(promise2,x,resolve,reject);
                         }catch (e) {
                             reject(e);
                         }

                     },0)
                 });
                 this.onRejectedCallbacks.push(()=>{
                     setTimeout(()=>{
                         try{
                             let x=onRejected(this.reason);
                             resolvePromise(promise2,x,resolve,reject);
                         }catch (e) {
                             reject(e);
                         }
                     },0)
                 });
                /*this.onResolvedCallbacks.push(onFulfilled);
                this.onRejectedCallbacks.push(onRejected);*/
            }
        });
        return promise2;

    }
    catch(onRejected){
        return this.then(null,onRejected);
    }
    finally(cb){
        return this.then(data=>{
            cb();
            return data;
        },err=>{
            cb();
            throw err;
        })
    }
}
let resolvePromise=((promise2,x,resolve,reject)=>{
    if(promise2===x){
        throw new TypeError('TypeError: Chaining cycle detected for promise #<Promise>');
    }
    if((x!==null&&typeof x==="object")||typeof x==="function"){
        try{//取then发生异常，所以加个try,catch
            let then=x.then;
            if(typeof then==="function"){
                then.call(x,y=>{
                    resolvePromise(promise2,y,resolve,reject);
                },r=>{
                    reject(r);
                })
            }else{//否则就是普通对象
                resolve(x);
            }
        }catch (e) {
            reject(e);
        }
    }else{
        resolve(x);//返回值x不是对象或者函数这就是普通值
    }

});
//类上的静态方法
Promise.resolve=(value)=>{
    return new Promise((resolve,reject)=>{
        resolve(value);
    })
};
Promise.reject=(reason)=>{
    return new Promise((resolve,reject)=>{
        reject(reason);
    })
};
Promise.all=(promises)=>{
    return new Promise((resolve,reject)=>{
        let result=[];
        let index=0;
        let proccessData=(i,data)=>{
            index++;
            result[i]=data;
            if(index===promises.length){
                 resolve(result);
            }

        };
        for(let i=0;i<promises.length;i++){
            if(typeof promises[i].then==="function"){
                promises[i].then((data)=>{
                    proccessData(i,data);
                },err=>{
                    reject(err);
                })
            }else{
                proccessData(i,promises[i])
            }

        }
    })

};
Promise.race=(promises)=>{
    return new Promise((resolve,reject)=>{
        for(let i=0;i<promises.length;i++){
            let promise=promises[i];
           if(typeof promise.then==="function"){
               promise.then(resolve,reject)
           }else{
               resolve(promise)
           }

        }
    })
};
module.exports=Promise;