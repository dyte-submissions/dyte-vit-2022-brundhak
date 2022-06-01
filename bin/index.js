#! /usr/bin/env node
const fetch = require("node-fetch");
const repoUrl = require("get-repository-url");
const yargs = require("yargs");
const csv = require("csvtojson");


//trimming the argv
const argv = yargs(process.argv.slice(2)).argv;
if (argv.file && argv.checkDependancy) {
	var givenDependancy = argv.checkDependancy; // getting dependency and file
	var fileNameCSV = argv.file; // preprocessing the dependency name and its version
	var tempDependancyArray = givenDependancy.split("@");
	var dependancyName = tempDependancyArray[0];
	var version = tempDependancyArray[1];
	
	
	//converting a string version number to an integer version number and saving it
	var givenVersionArray = version.split(".");
	var versionMajor = parseInt(givenVersionArray[0]);
	var versionMinor = parseInt(givenVersionArray[1]);
	var versionPatch = parseInt(givenVersionArray[2]);



	//Importing the CSV in CLI and converting it into JSON data
	console.log("*********************************************************************************************");
	console.log(
		"Name" +
			"\t\t\t" +
			"Version" +
			"\t\t\t" +
			"version_satisfied" +
			"\t\t" +
			`${argv.update && "Update PR"}`
	);
	console.log("*********************************************************************************************");
	var data = [{}];
	
	
	// storing data as array of objects
	
	csv()
		.fromFile(fileNameCSV)
		.then((JSONdata) => {
			data = JSONdata;
			data.map((dataPackage) => {
				var repoLink = dataPackage.repo;
				var packageLink = repoLink.substring(18, repoLink.length);
				// creating raw link 

				let left = "https://raw.githubusercontent.com";
				let right = "/main/package.json";
				let RawPackageJSONLink = left.concat(packageLink);
				RawPackageJSONLink = RawPackageJSONLink.concat(right);

				const gettingName = async () => {

					try {
						const name = await fetch(RawPackageJSONLink);
						const txt = await name.json();
						return txt;
					} catch (err) {
						console.log("fetch error", err);
					}
				};

				(async () => {
					const getText = await gettingName();
					//pre-processing version in the repos.
					var objectValue = JSON.parse(
						JSON.stringify(getText.dependencies)
					);
					set = objectValue[dependancyName];

					if (!argv.update) { // checking update
						if (set) {
							if (set.charAt(0) == "^" || set.charAt(0) == "~") {
								set = set.substring(1); // remove ~ or ^
							}
							var currentVersionArray = set.split(".");
							var currentMajor = parseInt(currentVersionArray[0]);
							var currentMinor = parseInt(currentVersionArray[1]);
							var currentPatch = parseInt(currentVersionArray[2]);
							if (
								versionMajor > currentMajor ||
								versionMinor > currentMinor ||
								versionPatch > currentPatch
							) {
								console.log(
									getText.name + "\t" + set + "\t\t\t" + "False"
								);// older version
							} else {
								console.log(
									getText.name + "\t" + set + "\t\t\t" + "True"
								);//uptodate version
							}
						} else {
							console.log(
								getText.name + "\t" + set + "\t\t" + "UnAvailable"
							);//package not found
						}
					}


					//display Update PR table
					else {
						if (set) {
							if (set.charAt(0) == "^" || set.charAt(0) == "~") {
								set = set.substring(1);// remove ~ or ^
							}
							var currentVersionArray = set.split(".");

							// parse int
							var currentMajor = parseInt(currentVersionArray[0]);
							var currentMinor = parseInt(currentVersionArray[1]);
							var currentPatch = parseInt(currentVersionArray[2]);

							//  print PR_URL
							var pullURLHandler = () => {
								repoUrl(dependancyName).then(function (url) {
									pullURL = url.concat("/pulls");
									console.log(pullURL);
								});
							};
							//check package & current version
							if (
								versionMajor > currentMajor ||
								versionMinor > currentMinor ||
								versionPatch > currentPatch
							) {
								console.log(
									getText.name +
										"\t" +
										set +
										"\t\t\t" +
										"False" +
										"\t\t\t\t" +
										pullURLHandler()
								);// older version
							} else {
								console.log(
									getText.name +
										"\t" +
										set +
										"\t\t\t" +
										"True" +
										"\t\t\t"
								);//uptodate version
							}
						} else {
							console.log(
								getText.name +
									"\t" +
									set +
									"\t\t" +
									"UnAvailable" +
									"\t\t\t" +
									"UnAvailable"
							);//package not found
						}
					}
					
					console.log("---------------------------------------------------------------------------------------------");
				})();
			});
		});
		
} else {
	console.log("Attempt again");
}
