var Promoter = require("./../models/Promoter");
var promoter_helper = {};
var inspireBrand=require("./../models/Inspired_Brand_submit");
/*
 * get_promoter_by_id is used to fetch promoter details by promoter id
 * 
 * @params  promoter_id     _id field of promoter collection
 * 
 * @return  status 0 - If any internal error occured while fetching promoter data, with error
 *          status 1 - If promoter data found, with promoter object
 *          status 2 - If promoter not found, with appropriate message
 */
promoter_helper.get_promoter_by_id = async (promoter_id) => {
    try {
        var promoter = await Promoter.findOne({ "_id": { "$eq": promoter_id } });
        if (promoter) {
            return { "status": 1, "message": "Promoter details found", "promoter": promoter };
        } else {
            return { "status": 2, "message": "Promoter not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding promoter", "error": err }
    }
};

/*
 * get_promoter_by_email is used to fetch single promoter by email address
 * 
 * @param   email   Specify email address of promoter
 * 
 * @return  status  0 - If any error occur in finding promoter, with error
 *          status  1 - If Promoter found, with found promoter document
 *          status  2 - If Promoter not found, with appropriate error message
 * 
 * @developed by "ar"
 */
promoter_helper.get_promoter_by_email_or_username = async (email_or_username) => {
    try {
        var promoter = await Promoter.findOne({ "$or" : [{"email": email_or_username} , {"username":email_or_username}] }).lean();
        if (promoter) {
            return { "status": 1, "message": "Promoter details found", "promoter": promoter };
        } else {
            return { "status": 2, "message": "Promoter not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding promoter", "error": err }
    }
};

/*
 * insert_promoter is used to insert into promoter collection
 * 
 * @param   promoter_object     JSON object consist of all property that need to insert in collection
 * 
 * @return  status  0 - If any error occur in inserting promoter, with error
 *          status  1 - If faculty inserted, with inserted promoter's document and appropriate message
 * 
 * @developed by "ar"
 */
promoter_helper.insert_promoter = async (promoter_object) => {
    let promoter = new Promoter(promoter_object)
    try{
        let promoter_data = await promoter.save();
        return { "status": 1, "message": "Promoter inserted", "promoter": promoter_data };
    } catch(err){
        return { "status": 0, "message":"Error occured while inserting promoter","error": err };
    }
};

/*
 * update_promoter_by_id is used to update promoter data based on promoter_id
 * 
 * @param   promoter_id         String  _id of promoter that need to be update
 * @param   promoter_object     JSON    object consist of all property that need to update
 * 
 * @return  status  0 - If any error occur in updating promoter, with error
 *          status  1 - If Promoter updated successfully, with appropriate message
 *          status  2 - If Promoter not updated, with appropriate message
 * 
 * @developed by "ar"
 */
promoter_helper.update_promoter_by_id = async (promoter_id, promoter_object) => {
    try {
        let promoter = await Promoter.findOneAndUpdate({ _id: promoter_id }, promoter_object);
        if (!promoter) {
            return { "status": 2, "message": "Record has not updated" };
        } else {
            return { "status": 1, "message": "Record has been updated", "promoter": promoter };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while updating promoter", "error": err }
    }
};

/*
 * get_promoter_by_id is used to fetch promoter details by promoter id
 * 
 * @params  promoter_id     _id field of promoter collection
 * 
 * @return  status 0 - If any internal error occured while fetching promoter data, with error
 *          status 1 - If promoter data found, with promoter object
 *          status 2 - If promoter not found, with appropriate message
 */
promoter_helper.get_all_brand = async () => {
    try {
        var brand = await Promoter.find({status:true},{"industry_description":1,"company":1});
        if (brand) {
            return { "status": 1, "message": "Brand details found", "brand": brand };
        } else {
            return { "status": 2, "message": "Brand not found" };
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Brand", "error": err }
    }
};
/*
 * get_promoter_by_id is used to fetch promoter details by promoter id
 * 
 * @params  promoter_id     _id field of promoter collection
 * 
 * @return  status 0 - If any internal error occured while fetching promoter data, with error
 *          status 1 - If promoter data found, with promoter object
 *          status 2 - If promoter not found, with appropriate message
 */
promoter_helper.insert_inspired_brand = async (promoter_object) => {
    let promoter = new inspireBrand(promoter_object);
    try{
        let promoter_data = await promoter.save();
        return { "status": 1, "message": "Brand inserted", "brand": promoter_data };
    } catch(err){
        return { "status": 0, "message":"Error occured while Brand ","error": err };
    }
};

module.exports = promoter_helper;