const { testRestrictionLevel } = require("../Modules/miscFunctions");




async function verifyRestriction(req, res) {
    const {sessiontoken} = req.body;

    try {
        let restriction = await testRestrictionLevel(sessiontoken)
        if (restriction < 3)  {
        return res.status(400).json({ success: true, message: "invalid restriction level"});
        } 
        return res.status(200).json({ success: true, message: "valid restriction level"});
        
    } catch (err) {
        console.log("and error occured in verifyRestriction error:" + verifyRestriction)
    }
}


module.exports = {verifyRestriction}