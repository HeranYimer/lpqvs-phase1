import db from "../config/db.js";

export const createApplication = (req,res)=>{

const {
name,
fayida_id,
kebele_id,
address,
marital_status
} = req.body;

const files = req.files;

db.query(
"INSERT INTO applicants (name,fayida_id,kebele_id,address,marital_status) VALUES (?,?,?,?,?)",
[name,fayida_id,kebele_id,address,marital_status],
(err,result)=>{

if(err) return res.status(500).json(err);

const applicantId = result.insertId;

db.query(
"INSERT INTO applications (applicant_id,status) VALUES (?,?)",
[applicantId,"Pending"],
(err,result)=>{

if(err) return res.status(500).json(err);

const applicationId = result.insertId;

if(files){

const docs = [];

if(files.signature){
docs.push([
applicationId,
"signature",
files.signature[0].filename
]);
}

if(files.fayida_doc){
docs.push([
applicationId,
"fayida_id",
files.fayida_doc[0].filename
]);
}

if(files.kebele_doc){
docs.push([
applicationId,
"kebele_id",
files.kebele_doc[0].filename
]);
}

if(docs.length > 0){

db.query(
"INSERT INTO documents (application_id,doc_type,file_path) VALUES ?",
[docs]
);

}

}

res.json({
message:"Application submitted successfully"
});

});

});

};