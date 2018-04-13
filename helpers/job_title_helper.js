var Job_title = require("./../models/Job_title");
var job_title_helper = {};
/*
 * get_all_job_title is used to fetch all job_title data
 * 
 * @return  status 0 - If any internal error occured while fetching job_title data, with error
 *          status 1 - If job_title data found, with job_title object
 *          status 2 - If job_title not found, with appropriate message
 */
job_title_helper.get_all_job_title = async () => {
    try {
        var job_title = await Job_title.find({},{"job_title":1});
        if (job_title ) {
            return { "status": 1, "message": "Job title found", "job_title": job_title };
        } else {
            return { "status": 2, "message": "No Job title available" };   
        }
    } catch (err) {
        return { "status": 0, "message": "Error occured while finding Job title", "error": err }
    }
}

module.exports = job_title_helper;