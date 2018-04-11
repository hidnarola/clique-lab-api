define({ "api": [
  {
    "type": "get",
    "url": "/promoter/setting/:key",
    "title": "Get settings value",
    "name": "Get_settings_value",
    "group": "Promoter",
    "description": "<p>Get settings value by key</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>promoter's unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>Appropriate value for given key</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/promoter/index.js",
    "groupTitle": "Promoter"
  },
  {
    "type": "post",
    "url": "/promoter/update_profile",
    "title": "Update promoter profile",
    "name": "Update_promoter_profile",
    "group": "Promoter",
    "description": "<p>Update promoter info</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>multipart/form-data</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>promoter's unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "name",
            "description": "<p>Full name of promoter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "company",
            "description": "<p>Company name of the company</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "industry_category",
            "description": "<p>Industry category id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "industry_description",
            "description": "<p>Industry description</p>"
          },
          {
            "group": "Parameter",
            "type": "File",
            "optional": true,
            "field": "avatar",
            "description": "<p>Industry avatar/logo</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/promoter/index.js",
    "groupTitle": "Promoter"
  },
  {
    "type": "post",
    "url": "/promoter/campaign",
    "title": "Add new campaign",
    "name": "Add_new_campaign",
    "group": "Promoter_Campaign",
    "description": "<p>Add new campaign</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>multipart/form-data</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>promoter's unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "start_date",
            "description": "<p>Campaign start date</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "end_date",
            "description": "<p>Camoaign end date</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "call_to_action",
            "description": "<p>Call to action</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "discount_code",
            "description": "<p>_id of discount code</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "description",
            "description": "<p>Description</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": false,
            "field": "social_media_platform",
            "description": "<p>Social media platform</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": true,
            "field": "hash_tag",
            "description": "<p>Hash tag for campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": true,
            "field": "at_tag",
            "description": "<p>At tag for campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "privacy",
            "description": "<p>Privacy for campaign i.e. public or invite</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": false,
            "field": "media_format",
            "description": "<p>Privacy for campaign i.e. public or invite</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "location",
            "description": "<p>Location of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "price",
            "description": "<p>Price of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": false,
            "field": "currency",
            "description": "<p>Currency of given price</p>"
          },
          {
            "group": "Parameter",
            "type": "File",
            "optional": false,
            "field": "cover_image",
            "description": "<p>Cover image of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "Array_of_file",
            "optional": false,
            "field": "board_image",
            "description": "<p>Mood board images of campaign</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/promoter/campaign.js",
    "groupTitle": "Promoter_Campaign"
  },
  {
    "type": "post",
    "url": "/promoter/group",
    "title": "Add group",
    "name": "Add_group",
    "group": "Promoter_Group",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>multipart/form-data</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>Promoter's unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Group name</p>"
          },
          {
            "group": "Parameter",
            "type": "file",
            "optional": true,
            "field": "image",
            "description": "<p>Group image</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "group",
            "description": "<p>Group details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/promoter/group.js",
    "groupTitle": "Promoter_Group"
  },
  {
    "type": "post",
    "url": "/promoter/user",
    "title": "Get all user",
    "name": "Get_all_user",
    "group": "Promoter_User",
    "description": "<p>Get user based on given criteria</p> <p>{&quot;filter&quot;:[</p> <p>{&quot;field&quot;:&quot;gender&quot;,&quot;type&quot;:&quot;exact&quot;,&quot;value&quot;:&quot;female&quot;},</p> <p>{&quot;field&quot;:&quot;age&quot;, &quot;type&quot;:&quot;between&quot;, &quot;min_value&quot;:21,&quot;max_value&quot;:25},</p> <p>{&quot;field&quot;:&quot;location&quot;,&quot;type&quot;:&quot;like&quot;,&quot;value&quot;:&quot;surat&quot;},</p> <p>{&quot;field&quot;:&quot;fb_friends&quot;, &quot;type&quot;:&quot;between&quot;, &quot;min_value&quot;:250,&quot;max_value&quot;:500},</p> <p>{&quot;field&quot;:&quot;insta_followers&quot;, &quot;type&quot;:&quot;between&quot;, &quot;min_value&quot;:250,&quot;max_value&quot;:500},</p> <p>{&quot;field&quot;:&quot;twitter_followers&quot;, &quot;type&quot;:&quot;between&quot;, &quot;min_value&quot;:250,&quot;max_value&quot;:500},</p> <p>{&quot;field&quot;:&quot;pinterest_followers&quot;, &quot;type&quot;:&quot;between&quot;, &quot;min_value&quot;:250,&quot;max_value&quot;:500},</p> <p>{&quot;field&quot;:&quot;job_industry&quot;, &quot;type&quot;:&quot;id&quot;, &quot;value&quot;:&quot;5ac1a4147111f5d4332a4324&quot;},</p> <p>{&quot;field&quot;:&quot;year_in_industry&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:5},</p> <p>{&quot;field&quot;:&quot;education&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:&quot;greduate&quot;},</p> <p>{&quot;field&quot;:&quot;language&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:&quot;english&quot;},</p> <p>{&quot;field&quot;:&quot;ethnicity&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:&quot;indian&quot;},</p> <p>{&quot;field&quot;:&quot;interested_in&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:&quot;male&quot;},</p> <p>{&quot;field&quot;:&quot;relationship_status&quot;, &quot;type&quot;:&quot;exact&quot;, &quot;value&quot;:&quot;Unmarried&quot;},</p> <p>{&quot;field&quot;:&quot;music_taste&quot;, &quot;type&quot;:&quot;id&quot;, &quot;value&quot;:&quot;5ac1a4477111f5d4332a4351&quot;}],</p> <p>&quot;sort&quot;:[{&quot;field&quot;:&quot;name&quot;, &quot;value&quot;:1}, {&quot;field&quot;:&quot;email&quot;, &quot;value&quot;:-1}] // -1 for descending, 1 for ascending</p> <p>&quot;page_size&quot;:2, &quot;page_no&quot;:1 }</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>promoter's unique access-key</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Array",
            "optional": true,
            "field": "filter",
            "description": "<p>Filter array contains field by which records need to filter</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "sort",
            "description": "<p>Sort contains field by which records need to sort</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "page_size",
            "description": "<p>Total number of record on page</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "page_no",
            "description": "<p>Current page</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "users",
            "description": "<p>Users details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/promoter/user.js",
    "groupTitle": "Promoter_User"
  },
  {
    "type": "get",
    "url": "/job_industry",
    "title": "Get all job industry",
    "name": "Get_all_job_industry",
    "group": "Root",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "job_industry",
            "description": "<p>Array of Job_industry document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "post",
    "url": "/login",
    "title": "Login",
    "name": "Login",
    "group": "Root",
    "description": "<p>Login request</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "social_id",
            "description": "<p>as Social identification</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "user",
            "description": "<p>user object.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Unique token which needs to be passed in subsequent requests.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>Unique token which needs to be passed to generate next access token.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "get",
    "url": "/music_taste/",
    "title": "Music Taste - Get all",
    "name": "Music_taste___Get_all",
    "group": "Root",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Music",
            "description": "<p>taste of User document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "post",
    "url": "/promoter_login",
    "title": "Promoter Login",
    "name": "Promoter_Login",
    "group": "Root",
    "description": "<p>Login request for promoter role</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "login_id",
            "description": "<p>Email or username</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>Password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "promoter",
            "description": "<p>Promoter object.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Unique token which needs to be passed in subsequent requests.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "refresh_token",
            "description": "<p>Unique token which needs to be passed to generate next access token.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "post",
    "url": "/promoter_signup",
    "title": "Promoter Signup",
    "name": "Promoter_Signup",
    "group": "Root",
    "description": "<p>Signup request for promoter role</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Full name of promoter</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>Username</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email address</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "company",
            "description": "<p>Name of the company</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>Password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "get",
    "url": "/promoter_email_verify/:token",
    "title": "Promoter email verification",
    "name": "Promoter_email_verification",
    "group": "Root",
    "description": "<p>Email verification request for promoter</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "post",
    "url": "/promoter_forgot_password",
    "title": "Promoter forgot password",
    "name": "Promoter_forgot_password",
    "group": "Root",
    "description": "<p>Forgot password request for promoter role</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Appropriate success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "post",
    "url": "/promoter_reset_password",
    "title": "Promoter reset password",
    "name": "Promoter_reset_password",
    "group": "Root",
    "description": "<p>Reset password request for promoter role</p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>Reset password token</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>New password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Appropriate success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "type": "get",
    "url": "/interest",
    "title": "Interest - Get all",
    "name": "get_interest___Get_all",
    "group": "Root",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Interest",
            "description": "<p>of User document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "Root"
  },
  {
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of comapny</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Image",
            "description": "<p>image of company</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "text",
            "description": "<p>text of company</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "price",
            "description": "<p>price of company</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "inspired",
            "description": "<p>Inspired details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "routes/user/brand.js",
    "groupTitle": "User",
    "name": ""
  },
  {
    "type": "get",
    "url": "/user/promoter",
    "title": "Brand  - Get",
    "name": "Brand___Get_all",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "brand",
            "description": "<p>Array of brand document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/brand.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/interest_details",
    "title": "Get interest details",
    "name": "Get_interest_details",
    "group": "User",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "job_industry",
            "description": "<p>Array of Job_industry document</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "interest",
            "description": "<p>Array of possible user interest</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "music_taste",
            "description": "<p>Array of possible user's music_taste</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/index.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/profile/create_profile",
    "title": "Create Profile",
    "name": "Profile___Add",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of profile</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>Username of profile</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email of profile</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "job_industry",
            "description": "<p>Job Industry of profile</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "music_taste",
            "description": "<p>Music Taste of profile</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "interest",
            "description": "<p>Interest of profile</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "profile",
            "description": "<p>details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/profile.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/social_registration",
    "title": "Social Registration",
    "name": "Social_Registration",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>Username of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "gender",
            "description": "<p>Gender of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "social_type",
            "description": "<p>Social Type of User</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "social_id",
            "description": "<p>Social Id of User</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "User",
            "description": "<p>details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/index.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/bank_detail",
    "title": "Update bank detail",
    "name": "Update_bank_detail",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>User Id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bank_name",
            "description": "<p>User Bank name</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "account_no",
            "description": "<p>User Bank Account Number</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "account_name",
            "description": "<p>User Bank Account Name</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "bsb",
            "description": "<p>User bsb</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "bank",
            "description": "<p>detail</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/profile.js",
    "groupTitle": "User"
  },
  {
    "type": "put",
    "url": "/user",
    "title": "Update user profile",
    "name": "Update_user_profile",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>multipart/form-data</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>User name</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>User Email</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "optional": false,
            "field": "user_interest",
            "description": "<p>User Interest</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "job_industry",
            "description": "<p>User Job Industry</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "music_taste",
            "description": "<p>User Music taste</p>"
          },
          {
            "group": "Parameter",
            "type": "File",
            "optional": true,
            "field": "avatar",
            "description": "<p>User avatar image</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "user",
            "description": "<p>User details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/index.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/campaign/myoffer",
    "title": "My offer Campaign  - Get all",
    "name": "approved_campaign___Get_all",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Array",
            "description": "<p>of Offered Campaign document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/campaign.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user/campaign/campaign_applied",
    "title": "Campaign  Add",
    "name": "campaign_applied___Add",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Content-Type",
            "description": "<p>application/json</p>"
          },
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "number",
            "optional": false,
            "field": "user_id",
            "description": "<p>User id of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": false,
            "field": "campaign_id",
            "description": "<p>Campaign id of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "description",
            "description": "<p>description of campaign</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "imaged",
            "description": "<p>Image of campaign</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "JSON",
            "optional": false,
            "field": "Campaign",
            "description": "<p>details</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/campaign.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/campaign/approved",
    "title": "campaigns - Get by ID",
    "name": "campaigns___Get_campaigns_by_ID",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_id",
            "description": "<p>ID of campaigns</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Approved",
            "description": "<p>Campaign Array of campaigns</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/campaign.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user",
    "title": "Profile - Get",
    "name": "get_profile_by_id___Get",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Profile",
            "description": "<p>as per id</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/index.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/bank_detail",
    "title": "Bank detail - Get",
    "name": "get_profile_by_id___Get",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "bank",
            "description": "<p>detail as per id</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/profile.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/campaign/public_campaign",
    "title": "Campaign  - Get all",
    "name": "public_campaign___Get_all",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Campaign",
            "description": "<p>Array of Campaign document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/campaign.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/campaign/:id",
    "title": "Campaign  - Get all",
    "name": "public_campaign___Get_by_id",
    "group": "User",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "x-access-token",
            "description": "<p>unique access-key</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "Campaign",
            "description": "<p>of Campaign document</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Validation or error message.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/user/campaign.js",
    "groupTitle": "User"
  }
] });
