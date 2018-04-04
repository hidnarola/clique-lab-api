var user_helper = {};
var User=require("./../models/User");

/*
 * user_helper is used to fetch all bank detail
 * 
 * @return  status 0 - If any internal error occured while fetching bank detail , with error
 *          status 1 - If bank detail  found, with bank object
 *          status 2 - If bank detail not found, with appropriate message
 */
user_helper.get_bank_detail = async (user_id) => {
    try {
        var user = await User.find({_id: user_id},{"bank.bank_name":1,"bank.account_name":1,"bank.account_number":1,"bank.bsb":1});
        if (user) {
            return { "status": 1, "message": "bank detail", "user": user };
        } else {
            return { "status": 2, "message": "No bank Detail available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding bank Detail", "error": err }
    }
}


/*
 * update_by_id is used to update User data based on user_id
 * 
 * @param   user_id         String  _id of promoter that need to be update
 * @param   user_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating user, with error
 *          status  1 - If User updated successfully, with appropriate message
 *          status  2 - If User not updated, with appropriate message
 * 
 * @developed by "mm"
 */
user_helper.bank_detail_update = async (user_id,bank_id,bank) => { 
    try {
        let user = await User.findOneAndUpdate(
            { "_id": user_id,"bank._id": bank_id },
             
            { 
                "$set": {
                    "bank.$.bank_name": bank.bank_name,
                    "bank.$.account_number": bank.account_number,
                    "bank.$.account_name": bank.account_name,
                    "bank.$.bsb": bank.bsb
                }   
            },

        );
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        console.log(err);
        return { "status": 0, "message": "Error occured while updating user", "error": err }
        
    }
};



/*
 * add_bank_to_user is used to insert into User collection
 * 
 * @param   bank     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting bank detail, with error
 *          status  1 - If bank detail inserted, with inserted bank detail's document and appropriate message
 * 
 * @developed by "mm"
 */

user_helper.add_bank_to_user = async (user_id, bank) => {
    try {
        let user = await User.findOneAndUpdate({ _id: user_id }, {$push:{"bank":bank}}, { new: true });
        if (!user) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "user": user };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating user", "error": err }
    }
};

module.exports = user_helper;