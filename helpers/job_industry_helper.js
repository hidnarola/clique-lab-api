var Job_industry = require("./../models/Job_industry");
var job_industry_helper = {};
/*
 * get_all_job_industry is used to fetch all job_industry data
 * 
 * @return  status 0 - If any internal error occured while fetching job_industry data, with error
 *          status 1 - If job_industry data found, with job_industry object
 *          status 2 - If job_industry not found, with appropriate message
 */
job_industry_helper.get_all_job_industry = async () => {
    console.log("1");
    try {
        var job_industry = await Job_industry.find();
        if (job_industry ) {
            console.log("2");
            return { "status": 1, "message": "Job_industry found", "Job_industry": job_industry };
        } else {
            console.log("3");
            return { "status": 2, "message": "No Job_industry available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Job Industry", "error": err }
    }
}
module.exports = job_industry_helper;