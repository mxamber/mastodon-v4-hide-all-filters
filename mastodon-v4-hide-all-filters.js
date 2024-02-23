const https = require('https');

/* first two arguments are node executable and script file */
if(process.argv.length < 4) {
	console.error("Please specify API access token and instance domain!");
	console.log("Format: node <script> <domain without protocol> <access token>");
	process.exit();
}

if(process.argv.length < 5 || process.argv[4] != "CONFIRM") {
	console.log("==== CONFIRMATION ====\n----------------------\n\nThis program will access your Mastodon account via the provided API credentials and update all of your filters (phrases, words, or expressions you have chosen to automatically hide from your timeline) to DROP posts (not display them at all) instead of hiding them behind a click-through.\n\nThis action will be applied automatically to ALL your filters once the program is run.\n\nIf you understand this and want to proceed, please re-run the program and add \"CONFIRM\" as the third command-line argument.\nI.e.: node <script> <domain> <token> CONFIRM.");
	
	console.log("\n= API scopes: =\nPlease enable the following scopes for API access:\n- read:accounts\n- read:filters\n- write:filters");
	
	process.exit();
}

const domain = process.argv[2];
const token = process.argv[3];

const api_url = "/api/v2/filters";
const proof_url = "/api/v1/accounts/verify_credentials";

var updates_success = 0;
var updates_fail = 0;
var updates_err = 0;

console.log("Establishing connection to " + domain + "...");

/* test access token to verify API access is provided */

let options_verify_credentials = {
	host: domain,
	port: 443,
	path: proof_url,
	method: "GET",
	headers: {
		"Authorization": "Bearer " + token
	}
};

let request_verify_credentials = https.request(options_verify_credentials, response => {
	console.log("Verifying API credentials for " + domain + "...");
	
	if(response.statusCode == 200) {
		console.log("SUCCESS: API credentials for " + domain + " verified!");

		/* create new request to request all filters the user has */
		let options_all_filters = {
			host: domain,
			port: 443,
			path: api_url,
			method: "GET",
			headers: {
				"Authorization": "Bearer " + token
			}
		};
		let request_all_filters = https.request(options_all_filters, response => {
			console.log("Requesting filter data...");
			
			/* read chunk by chunk, verify response code confirms a successful query */
			let data_filters_raw = "";
			response.on("data", chunk => { data_filters_raw += chunk; });
			response.on("end", () => {
				if(response.statusCode != 200) {
					console.error("ERROR: Received unexpected response (error code " + response.statusCode + ")\n\n" + data_filters_raw);
					process.exit(1);
				}
				
				console.log("Data received! Parsing...");
				
				/* test if we received valid JSON; Mastodon tends to send a proper 404 / 403 webpage back as a response to malformed queries. abort if not. there is a lot of testing here to verify we get a readable API response, the correct API response, and it contains the kinds of objects we want to operate on. there are lots of cases where we might want to abort. */
				var filters;
				try {
					filters = JSON.parse(data_filters_raw);
				} catch(err) {
					console.error("ERROR: Could not parse received data!\n\n" + data_filters_raw);
					process.exit();
				}
								
				console.log("SUCCESS: JSON parsed! Found " + filters.length + " filters!");
				
				if(filters.length == 0) {
					console.log("WARNING: zero (0) filters found. Please verify that you have filters set up and re-run. Aborting...");
					process.exit(1);
				}
				
				/* if there are no filter objects as expected in the response (who have an id and title attribute), abort */
				if(
					filters[0].id == null ||
					filters[0].id == undefined ||
					filters[0].title == null ||
					filters[0].title == undefined
				) {
					console.error("ERROR: Malformed response! Aborting...\n\n" + JSON.stringify(filters));
					process.exit(1);
				}
				
				console.log("SUCCESS: verified response! Updating all filters...");
				
				filters.forEach(filter => {
					let options_update_filter = {
						host: domain,
						port: 443,
						path: api_url + "/" + filter.id + "?filter_action=hide",
						method: "PUT",
						headers: {
							"Authorization": "Bearer " + token
						}
					};
					
					let request_update_filter = https.request(options_update_filter, response => {
						response.on("error", err => {
							console.log("ERROR: Could not update filter #" + filter.id + "!\n\n" + err);
							updates_err++;
						});
						
						if(response.statusCode == 200) {
							console.log("SUCCESS: updated filter #" + filter.id + "!");
							updates_success++;
						} else {
							console.log("WARNING: Failed to update filter #" + filter.id + "! (error code " + response.statusCode + ")");
							updates_fail++;
						}
					});
					
					request_update_filter.end();
				});
				
			});
			response.on("error", err => {
				console.error("ERROR: Could not retrieve filter data!\n\n" + err);
			});
		});
		
		request_all_filters.end();
		
		/* tons of status codes if the API verification fails to inform the user what they need to change */
	} else if(response.statusCode == 401) {
		console.error("ERROR: API access failed! Incorrect or invalid access token. Verify that scopes are set correctly! (error code 401 Unauthorized)");
		process.exit(1);
	} else if(response.statusCode == 403) {
		console.error("ERROR: API access failed! Your user account is currently disabled, missing a confirmed email address, or pending approval (error code 403 Forbidden)");
		process.exit(1);
	} else if(response.statusCode == 422) {
		console.error("ERROR: API access failed! Token does not have an authorized user (error code 422 Unprocessable entity)");
		process.exit(1);
	} else {
		console.error("ERROR: API access failed! An unknown error has occured (" + response.statusCode + "). This was not supposed to happen!");
		process.exit(1);
	}
});

request_verify_credentials.end();
