import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {JWT_SECRET} from '../config/keys';
import fs from 'fs';
import mime from 'mime';
//import upload from '../middleware/upload';
//import requireLogin from '../middleware/requireLogin';
// const jwt = require('jsonwebtoken')
// const {JWT_SECRET} = require('../config/keys')
// const requireLogin = require('../middleware/requireLogin')
import { RegistersSchema, PilotSchema, passengerSchema } from '../models/registerModel';
import fcm from 'fcm-notification';
import { admin } from '../firebase/firebase-config';
import serviceAccount from '../firebase/clanit-e903d-firebase-adminsdk-wnrln-95e51dd8ee.json'; 

import { Console } from 'console';
import { Long } from 'mongodb';
const FcM = new fcm(serviceAccount);


const Register = mongoose.model('Register', RegistersSchema);
const Passenger = mongoose.model('Passenger', passengerSchema);
const Pilot = mongoose.model('Pilot', PilotSchema);

//var Token = "abc";

export const addnewRegister = (req, res, next) => {
  
//   let newRegister = new Register(req.body);
//  // if(req.file){
//    //        newRegister.Image = req.file.path
//      //    }
//   newRegister.save((err, login) => {
//         if (err) {
//             res.send(err);
//         }
//         res.json(login);
//     });
  // if(req.body.Email.length > 1 && req.body.FirstName.length > 1 && req.body.LastName.length > 1 && req.body.DOB.length > 1 && req.body.Mobile.length > 1 && req.body.Password.length > 1){
  // Register.find({ Email: req.body.Email })
  // .exec()
  // .then(user => {
  //   if (user.length < 1) {
  //     newRegister.save();
  //     res.send('Login successfully!')
  //   }else{
  //       res.send('email already exist')
  //   }
  // });}
  // else{
  //   res.send("Please enter the medatory fields")
  // }

    let newRegister = new Register(req.body);
    const mail = req.body.Email;
    const fname = req.body.FirstName;
    const lname = req.body.LastName;
    const birth = req.body.DOB;
    const driver_pass = req.body.Is_driver_or_passenger;
    const mbile = req.body.Mobile;
    const pass = req.body.Password;

    //console.log('mail',mail)
    if(mail == '' || mail == undefined){
       return res.send('Plase Enter Your Email Address')
    }if(pass == '' || pass == undefined){
       return res.send('Plase Enter Your Password')
    }
    if(fname == '' || fname == undefined){
      return res.send('Plase Enter Your First Name')
    }
    if(lname == '' || lname == undefined){
      return res.send('Plase Enter Your Last Name')
    }
    if(birth == '' || birth == undefined){
      return res.send('Plase Enter Your Birth Date')
    }
    if(driver_pass == '' || driver_pass == undefined){
      return res.send('Plase decide driver or passenger')
    }
    if(mbile == '' || mbile == undefined){
      return res.send('Plase Enter Your Mobile number')
    }
    else{
   // if(req.body.Email.length > 1){
    Register.find({ Email: req.body.Email })
    .exec()
    .then(user => {
      if (user.length < 1) {
        // to declare some path to store your converted image

          // if(req.file){
          //   newRegister.Image = req.file.path
          // }
        newRegister.save();
        res.send('Registered successfully!')
      }else{
          res.send('email already exist')
      }
    });
  }
    //else{
      //res.send("Please enter the medatory fields")
    //}    
}



export const getRegister = async (req, res) => {
    const { page = 1, limit = 5 } = req.query;
    const rlist = await Register.find().limit(limit * 1).skip((page - 1) * limit)
    res.send(rlist); 
     //=> {
    //     if (err) {
    //         res.send(err);
    //     }
    //     //requireLogin(req, res);
    //     res.send(register);
    //     //res.json(register);
    // });
}
//tokenGenerator
export const tokenGenerator = (req, res, next) => {
  //const data = Register.find({ Email: req.body.Email })
  Register.find({ Email: req.body.Email })
  .exec()
  .then(user => {
    if (user.length < 1) {
      return res.status(401).json({
        message: "Wrong Username"
      });
    }else{
      Register.find({ Password: req.body.Password })
      .exec()
      .then(user => {
          if (user.length < 1) {
            return res.status(401).json({
              message: "Wrong Password"
            });
          }else{
            const Token = jwt.sign({_id:user._id},JWT_SECRET)
            const ftoken = req.body.ftoken;
        
            //console.log(Token);
            
             Register.findOneAndUpdate({Email: req.body.Email }, { $set:
              {
                Token: Token,
                fcmToken: ftoken
              }
           },
          null, function (err, docs, next) {
    if (err){
        console.log(err)
    }
    else{
      ///////////
      res.status(401).json({
        message: "FCMtoken: ",ftoken
      });
      const tokken = docs.Token;
    }
  });
}
  });
}
      });  
}
export const userLogin = (req, res, next) => {
    //const data = Register.find({ Email: req.body.Email })
    Register.find({ Email: req.body.Email })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Wrong Username"
        });
      }else{
        Register.find({ Password: req.body.Password })
        .exec()
        .then(user => {
            if (user.length < 1) {
              return res.status(401).json({
                message: "Wrong Password"
              });
            }else{
            const Token = jwt.sign({_id:user._id},JWT_SECRET)
            const ftoken = req.body.ftoken;
        
            //console.log(Token);
            
             Register.findOneAndUpdate({Email: req.body.Email }, { $set:
              {
                Token: Token,
                fcmToken: ftoken 
              }
           },
          null, function (err, docs, next) {
    if (err){
        console.log(err)
    }
    else{
      ///////////
      const tokken = docs.Token;
      //console.log(tokken);
      const is_driver = docs.Is_driver_or_passenger;
      const { page = 1, limit = 5 } = req.query;
      if(is_driver == true){
        var jsonToSend = [];

 Register
   .findOne({ Email: req.body.Email })
   .populate("history",{ Token: 0 }) // key to populate
   .then(user => {
     const user_history = user.history;
     //console.log('user_history',user_history);
     var myname;
     if(user_history == ''){
      res.status(200).json(
        {
            Token,
            is_driver
        }
    )
     }else{

user_history.forEach(async (element, index, array) => {

      let temp = element.poster;
      var value = await Register.findOne(temp).select('FirstName LastName Image Mobile')

      var jsonObject = JSON.parse("{}")


      jsonObject.is_trip_completed = element.is_trip_completed
      jsonObject.post_id = element._id
      jsonObject.pick_up = element.PickUp
      jsonObject.drop_off = element.DropOff
      jsonObject.time = element.Time
      jsonObject.description = element.Description
      jsonObject.FirstNamePassenger = value.FirstName
      jsonObject.LastNamePassenger = value.LastName
      jsonObject.ImagePassenger = value.Image
      jsonObject.MobilePassenger = value.Mobile
      //jsonObject.Token = Token
      //jsonObject.is_driver = is_driver

      jsonToSend.push(jsonObject)

         if (index == array.length - 1) {
          
             funName(jsonToSend, Token, is_driver);
         }
});
function funName(list, token, is_driver) {

  res.status(200).json({
    list,
    token,
    is_driver   
  });
 }
}
    });
  //       Register
  //  .findOne({_id: docs._id })
  //  .populate("plist",{ Token: 0, poster: 0 }).limit(limit * 1).skip((page - 1) * limit) // key to populate
  //  .then(user => {
  //    const list = user.plist;
  //   res.status(200).json(
  //     {
  //       list,
  //       Token,
  //       is_driver
  //     }
  // )
  //  });
  }
   else{
    Register
    .findOne({_id: docs._id })
    .populate("plist",{ Token: 0, poster: 0}).limit(limit * 1).skip((page - 1) * limit) // key to populate
    .then(user => {
      const list = user.plist;
     res.status(200).json(
       {
           list,
           Token,
           is_driver
       }
   )
    });
   }
      
      ///////////
      }      
      
    
});
    
            }
   
      });
      }
    });
}
export const driverHistory = async (req, res) => { 
  const tkn = await Register.findOne({ Token: req.body.Token })
  console.log(tkn._id);
  const checker = tkn.Is_driver_or_passenger;
  console.log(checker);
  const { page = 1, limit = 5 } = req.query;
    Register
   .findOne({_id: tkn._id })
   .populate("favlist",{ Token: 0, myfavorite: 0, _id: 0 }).limit(limit * 1).skip((page - 1) * limit) // key to populate
   .then(user => {
     const driver_list = user.favlist;
    res.status(200).json(
      {
        driver_list
      }
  )
   });
}
export const liveDriver = async (req, res) => { 
  await Pilot.find({ "FindPassenger": { $eq: true } },(err, login) => {
         if (err) {
             res.send(err);
         }
         res.json(login);
     });
}


// Get Passengers History
export const passengerHistory = async (req, res) => { 

  //const token = req.body.Token
  const tkn = await Register.findOne({ Token: req.body.Token })
  console.log(tkn._id);
  //var jsonToSend = [];
  //const tkn = await Register.findOne({ Token: req.body.Token })
  //console.log(tkn._id);

  //const checker = tkn.Is_driver_or_passenger;
  const { page = 1, limit = 5 } = req.query;
    Register
   .findOne({_id: tkn._id })
   .populate("plist",{ Token: 0, poster:0, _id:0}).limit(limit * 1).skip((page - 1) * limit) // key to populate
   .then(user => {
     const passenger_list = user.plist;
     var jsonarray = JSON.parse(JSON.stringify(passenger_list))

     function funName(jsonToSend) {
    
      //res.status(200).send(jsonarray);
     }
     if(passenger_list == ''){
       res.send('No History - 0 Posts')
     }
     else{

passenger_list.forEach(async (element, index, array) => {
      let temp = element.drivers;
      //console.log(temp);
      if(temp != undefined) {
      
      var value = await Register.findOne(temp).select('FirstName LastName Image Mobile');
      console.log('value', value.FirstName);
      // var jsonObject = JSON.parse("{}")

      // jsonObject.FirstNamePassenger = value.FirstName
      // jsonObject.LastNamePassenger = value.LastName
      // jsonObject.ImagePassenger = value.Image
      // jsonObject.MobilePassenger = value.Mobile

      // jsonToSend.push(jsonObject)
        jsonarray[index].FirstNameDriver = value.FirstName
        jsonarray[index].LastNameDriver = value.LastName
        jsonarray[index].ImageDriver = value.Image
        jsonarray[index].MobileDriver = value.Mobile
        
        res.status(200).send(jsonarray);
        }
        
        
         if (index == array.length - 1) {
          
             funName(jsonarray);
         }
    });
  }
   });
} 
// Get user's profile by ID
export const getUserProfile = (req, res) => {
    Register.findById(req.params.userID,{"_id":0, "FirstName":1,"LastName":1,"DOB":1,"Is_driver_or_passenger":1,"Image":1,"Mobile":1,"Email":1,"Gender":1,"Car_details":1}, (err, product) => {

        if (err) {
            res.send(err);
        }
        
        res.json(product);
    });
}
export const getEmail = (req, res) => {
    Register.find({ Email: req.body.Email })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Email doesnt exist."
        });
      }else{
        return res.status(201).json({
            message: "Login Successfully"
          });
            }
        });
      }
//let ra      
// export const tom = (requireLogin) => {
//   //let ra = requireLogin
//   console.log('test')
//   console.log(requireLogin)
//    return addDriver
//   }

export const addDriver = async (req, res, next) => {
  const tchecker = req.body.Token;
  console.log('checker',tchecker);
  if(tchecker == ''){
    res.status(401).json({
    message: "Please Enter the Token."
    });
  }else{
  const tkn = await Register.findOne({ Token: req.body.Token })
  console.log(tkn._id);
  
  const {placeID} = req.params;
  //const data = await Register.findOne({Token: tkn});
  //console.log(data._id); 
  const newPlace = new Pilot(req.body);
  //console.log(newPlace);
  //const data = requireLogin();
  
  const user = await Register.findById(tkn._id);
  newPlace.myfavorite = user; //myfavorite
  await newPlace.save();
  user.favlist.push(newPlace);
  const locality = req.body.Locality
  
  await user.save();
  await Passenger.find(
        {
          $and: [{$or:[
          {PickUp: { $regex: new RegExp(`^${locality}$`), $options: 'i' }},
          {DropOff: { $regex: new RegExp(`^${locality}$`), $options: 'i' }
        }
        ]},
        // {
        //   Time: {$gte: new Date().getTime()}
        // },
      {
        got_driver: false
      }
      ]
      },(err, login) => {
             if (err) {
                 res.send(err);
             }
             res.json(login);
         });
        }
  // let newDriver = new Pilot(req.body);
  // newDriver.save((err, driver) => {
  //     if (err) {
  //         res.send(err);
  //     }
  //     Passenger.find({},{"_id":0},(err, login) => {
  //         if (err) {
  //             res.send(err);
  //         }
  //         res.json(login);
  //     });
  //     //  res.json(driver);
  // });
       
    
    }

export const confirmBooking = async (req, res, next) => {
  const postid = await Passenger.findOne({ _id: req.body.poster })
  console.log(postid.poster);
  const tokenn = await Register.findOne({ Token: req.body.Token },{"_id":1,"FirstName":1,"LastName":1, "Image":1})
  const drvr = await Register.findOne({ _id: postid.poster },{"FirstName":1,"LastName":1,"Image":1});
  console.log('new',drvr);
  
  //var upost = JSON.stringify(postid)
  //var drinfo = JSON.stringify(tokenn)
  //console.log(tokenn);
               //const {placeID} = req.params;
  //const data = await Register.findOne({Token: tkn});
  //console.log(data._id); 
               //const newPlace = new Pilot(req.body);
  //console.log(newPlace);
  //const data = requireLogin();
  
  //////new
  const user = await Register.findById(tokenn._id);
  const driveR = await Register.findById(postid.poster);
  console.log('drive',driveR.fcmToken);
  //console.log(user);
  // newPlace.myfavorite = user; //myfavorite
  // await newPlace.save();
  user.history.push(tokenn,postid);

  //user.history.push(postid);
  //console.log("req.body.poster", req.body.poster);
  //console.log("postid", postid);
  //console.log("postid._id", postid._id);
Passenger.findOneAndUpdate({_id: postid._id}, { $set:
              {
                tripCancel: false,
                got_driver: true,
                drivers: tokenn._id
              }}, null, function(err,doc) {
           if (err) { throw err; }
           else { console.log("Updated"); }
         }); 


  await user.save();
  const registrationToken = driveR.fcmToken;
//   module.exports.sendToSingleUser = async (message, token) => {
//     let message_body = {
//         notification: {
//           score: ''+postid+'',
//           passenger: ''+drvr+''
//         },
//         token: registrationToken
//     };
//     FcM.send(message_body, function (err, response) {
//         if (err) {
//           console.log('Error', err);
//         } else {
//           console.log('Successfully sent message:', response);
//         }
//     })

// }

const message = {
  data: {
    post: ''+postid+'',
    driver: ''+drvr+''
  },
  token: registrationToken
};

// Send a message to the device corresponding to the provided
// registration token.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

  res.status(200).json({
    message: "Booking Confirmed"
  });
  
  // await Passenger.find({},{"_id":0},(err, login) => {
  //            if (err) {
  //                res.send(err);
  //            }
  //            res.json(login);
  //        });       
    } 

    
// Booking Cancellation
export const bookingCancellation = async (req, res, next) => {
  const postid = await Passenger.findOne({ _id: req.body.poster })
  console.log('poster',postid.poster);
  const tokenn = await Register.findOne({ Token: req.body.Token },{"FirstName":1,"LastName":1});
  const drvr = await Register.findOne({ _id: postid.poster },{"FirstName":1,"LastName":1,"Image":1});
  console.log('new',drvr);
  //console.log(tokenn);
               //const {placeID} = req.params;
  //const data = await Register.findOne({Token: tkn});
  //console.log(data._id); 
               //const newPlace = new Pilot(req.body);
  //console.log(newPlace);
  //const data = requireLogin();
  
  //////new
  //const user = await Register.findById(tokenn._id);
  const driveR = await Register.findById(postid.poster);
  console.log('drive',driveR.fcmToken);
  //console.log(user);
  // newPlace.myfavorite = user; //myfavorite
  // await newPlace.save();
 // const cancellation = user.history.filter(x => {
  //   return x.id != postid;
  // })
  // Register.findOneAndUpdate(
  //   {_id: tokenn._id},
  //   { $pull: { history: { _id: postid._id } } }, // Here , id is variable where your userid is stored
  //   { multi: true }
  // )
  
  // user.history.remove(postid);
  //console.log("req.body.poster", req.body.poster);
  //console.log("postid", postid);
  //console.log("postid._id", postid._id);
Passenger.findOneAndUpdate({_id: postid._id}, { $set:
              {
                tripCancel: true,
                got_driver: false,
                drivers: tokenn._id
              }}, null, function(err,doc) {
           if (err) { throw err; }
           else { console.log("Updated"); }
         }); 
         


  //await user.save();
  const registrationToken = driveR.fcmToken;

const message = {
  data: {
    score: ''+postid+'',
    passenger: ''+drvr+''
  },
  token: registrationToken
};

// Send a message to the device corresponding to the provided
// registration token.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

  res.status(200).json({
    message: "Booking Cancelled"
  });
  
  // await Passenger.find({},{"_id":0},(err, login) => {
  //            if (err) {
  //                res.send(err);
  //            }
  //            res.json(login);
  //        });       
    }     

//passenger calcelling trip  

export const passengerCancellation = async (req, res, next) => {
  const postid = await Pilot.findOne({ _id: req.body.poster })
  console.log('poster',postid.myfavorite);
  const tokenn = await Register.findOne({ Token: req.body.Token },{"FirstName":1,"LastName":1})
  const drvr = await Register.findOne({ _id: postid.myfavorite },{"FirstName":1,"LastName":1,"Image":1});
  console.log('new',drvr);
  //console.log(tokenn);
               //const {placeID} = req.params;
  //const data = await Register.findOne({Token: tkn});
  //console.log(data._id); 
               //const newPlace = new Pilot(req.body);
  //console.log(newPlace);
  //const data = requireLogin();
  
  //////new
  //const user = await Register.findById(tokenn._id);
  const driveR = await Register.findById(postid.myfavorite);
  console.log('drive',driveR.fcmToken);
  //console.log(user);
  // newPlace.myfavorite = user; //myfavorite
  // await newPlace.save();
 // const cancellation = user.history.filter(x => {
  //   return x.id != postid;
  // })
  // Register.findOneAndUpdate(
  //   {_id: tokenn._id},
  //   { $pull: { history: { _id: postid._id } } }, // Here , id is variable where your userid is stored
  //   { multi: true }
  // )
  
  // user.history.remove(postid);
  //console.log("req.body.poster", req.body.poster);
  //console.log("postid", postid);
  //console.log("postid._id", postid._id);
  Pilot.findOneAndUpdate({_id: postid._id}, { $set:
              {
                tripCancel: true
                //got_driver: false,
                //drivers: tokenn._id
              }}, null, function(err,doc) {
           if (err) { throw err; }
           else { console.log("Updated"); }
         }); 
         


//  await user.save();
  const registrationToken = driveR.fcmToken;


const message = {
  data: {
    score: ''+postid+'',
    driveer: ''+drvr+''
  },
  token: registrationToken
};

// Send a message to the device corresponding to the provided
// registration token.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });

  res.status(200).json({
    message: "Booking Cancelled"
  });
  
  // await Passenger.find({},{"_id":0},(err, login) => {
  //            if (err) {
  //                res.send(err);
  //            }
  //            res.json(login);
  //        });       
    }     

// drivers history (The booking he/she took)
export const datahistory = async (req, res, next) => {
  const tkn = await Register.findOne({ Token: req.body.Token })
  console.log('drid',tkn._id)
  var jsonToSend = [];

 Register
   .findOne({_id: tkn._id })
   .populate("history",{ Token: 0 }) // key to populate
   .then(user => {
     const user_history = user.history;
     //console.log('history',user_history);
     var myname;
     //console.log('history',user_history)
     if(user_history == ''){
       res.send('No History - 0 Posts')
     }
     else{

     

user_history.forEach(async (element, index, array) => {

      let temp = element.poster;
      var value = await Register.findOne(temp).select('FirstName LastName Image Mobile')

      var jsonObject = JSON.parse("{}")


      jsonObject.is_trip_completed = element.is_trip_completed
      jsonObject.post_id = element._id
      jsonObject.pick_up = element.PickUp
      jsonObject.drop_off = element.DropOff
      jsonObject.time = element.Time
      jsonObject.description = element.Description
      jsonObject.FirstNamePassenger = value.FirstName
      jsonObject.LastNamePassenger = value.LastName
      jsonObject.ImagePassenger = value.Image
      jsonObject.MobilePassenger = value.Mobile

      jsonToSend.push(jsonObject)

         if (index == array.length - 1) {
             funName(jsonToSend);
         }
});
function funName(jsonToSend) {
  res.status(200).json(
    jsonToSend
    );
 }
}
    });
    }

// update driver
export const updateDriver = async (req, res) => {
     const data = await Pilot.findOneAndUpdate({_id: req.params.productID}, req.body, { new: true, useFindAndModify: false });
     res.json(data);
    // , (err, product) => {
    //     if (err) {
    //         res.send(err);
    //     }
    //     res.json(product);
    // });
  }    

// passengers posting

export const addUserRequest = async (req, res) => {
  const tchecker = req.body.Token;
  console.log('checker',tchecker);
  if(tchecker == ''){
    res.status(401).json({
    message: "Please Enter the Token."
    });
  }else{
  const tkn = await Register.findOne({ Token: req.body.Token })
  console.log(tkn);
  //const data = await Register.findOne({token: Token});
  //console.log(data._id);  
  const newPlace = new Passenger(req.body);
  //console.log(Token);
  //console.log(newPlace);
 // const { page = 1, limit = 5 } = req.query;
  const user = await Register.findById(tkn._id)

  newPlace.poster = user;
  await newPlace.save();
  user.plist.push(newPlace);
  await user.save();
  //res.status(201).json(user);
  const { page = 1, limit = 5 } = req.query;
    Register
   .findOne({_id: tkn._id })
   .populate("plist",{ Token: 0, poster: 0, _id: 0 }).limit(limit * 1).skip((page - 1) * limit) // key to populate
   .then(user => {
     const passenger_list = user.plist;
    res.status(200).json(
      {
        passenger_list
      }
  )
   });
  }
    // let newUser = new Passenger(req.body);
    // newUser.save((err, driver) => {
    //     if (err) {
    //         res.send(err);
    //     }else{
    //     Register.find({Is_driver_or_passenger: {$eq: true}},{"_id":0,"FirstName":1,"LastName":1,"DOB":1,"Image":1,"Mobile":1,"Email":1,"Gender":1,"Car_details":1},(err, login) => {
    //         if (err) {
    //             res.send(err);
    //         }
    //         res.json(login);
    //     });
        
    //     }
    // });

}

export const getPassengerWithId = async (req, res) => {
   const tkn = await Register.findOne({ Token: req.body.Token })
   console.log(tkn._id);
  //const {placeID} = req.params;
    const userpost =  await Register.findById(tkn._id).populate('favlist');
    res.status(200).json(userpost.favlist) ;
  // Register.findById({_id: req.params.placeID},(err, product) => {

  //     if (err) {
  //         res.send(err);
  //     }
      
  //     res.json(product);
  // });
}
export const updatePassenger = (req, res) => {
    Passenger.findOneAndUpdate({_id: req.params.placeID}, req.body, { new: true, useFindAndModify: false }, (err, product) => {
        if (err) {
            res.send(err);
        }
        res.json(product);
    });
  }     