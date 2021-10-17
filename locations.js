const fs = require('fs');

let rawLocData = fs.readFileSync('data/locations.json',"utf8");
let locations = JSON.parse(rawLocData);

function rad2deg(radians)
{
    var pi = Math.PI;
    return radians * (180/pi);
}

function deg2rad(degrees) {
    return degrees * Math.PI / 180;
}

const getInRadius = function getLocationsInRadius(distance,zip){
    //Pull Lat and Lon Coords from zip then calculate distances from there
    let uniqueLocations = [];
    let uniqueCities = [];
    //get center point data
    let getCpData = locations.filter((location)=>{
        if(location.zip == zip){
            return true;
        }
    });
    let cpLon = getCpData[0].lon;
    let cpLat = getCpData[0].lat;
    let earthRad = 3959; //The Radius of the earth
    //compute max and min latitudes / longitudes for our search square
    let latNmax = rad2deg(Math.asin(Math.sin(deg2rad(cpLat)) * Math.cos(distance / earthRad) + Math.cos(deg2rad(cpLat)) * Math.sin(distance / earthRad) * Math.cos(deg2rad(0))));
    let latSmax = rad2deg(Math.asin(Math.sin(deg2rad(cpLat)) * Math.cos(distance / earthRad) + Math.cos(deg2rad(cpLat)) * Math.sin(distance / earthRad) * Math.cos(deg2rad(180))));
    let lonEmax = rad2deg(deg2rad(cpLon) + Math.atan2(Math.sin(deg2rad(90)) * Math.sin(distance / earthRad) * Math.cos(deg2rad(cpLat)), Math.cos(distance / earthRad) - Math.sin(deg2rad(cpLat)) * Math.sin(deg2rad(latNmax))));
    let lonWmax = rad2deg(deg2rad(cpLon) + Math.atan2(Math.sin(deg2rad(270)) * Math.sin(distance / earthRad) * Math.cos(deg2rad(cpLat)), Math.cos(distance / earthRad) - Math.sin(deg2rad(cpLat)) * Math.sin(deg2rad(latNmax))));
    //Shorten list of matches down to only coords that are within the top left bottom and right of the search square
    let locsInBox = locations.filter((loc)=>{
        if(loc.lat <= latNmax && loc.lat >= latSmax && loc.lon >= lonWmax && loc.lon <= lonEmax){
            return true;
        }
    })
    for(let ii=0;ii<locsInBox.length;ii++){
        let locId = locsInBox[ii].id;
        let locCounty = locsInBox[ii].county;
        let locCity = locsInBox[ii].city;
        let locState = locsInBox[ii].state;
        let locZip = locsInBox[ii].zip;
        let locLon = locsInBox[ii].lon;
        let locLat = locsInBox[ii].lat;

        //Of the roughed in matches, dont include the matches that are outside of actual distance, in corners of square.
        //This will carve out a circle with included zips.
        let trueDistance = Math.acos(Math.sin(deg2rad(cpLat)) * Math.sin(deg2rad(locLat)) + Math.cos(deg2rad(cpLat)) * Math.cos(deg2rad(locLat)) * Math.cos(deg2rad(locLon) - deg2rad(cpLon))) * earthRad;
        if(trueDistance < distance && trueDistance !== 0) {
            // Create a City Array and test if the city is in the array if it's not = add it. if it is = do nothing
            if(uniqueCities.indexOf(locCity)===-1){
                uniqueCities = [...uniqueCities,locCity];
                uniqueLocations = [
                    ...uniqueLocations,
                    {
                        id:locId,
                        county:locCounty,
                        city:locCity,
                        state:locState,
                        zip:locZip,
                        lon:locLon,
                        lat:locLat,
                        totalDistance:trueDistance
                    }]
            }
        }
    }
    uniqueLocations.sort(function(a, b){
        if(a.totalDistance < b.totalDistance){
            return -1;
        }
        if(a.totalDistance > b.totalDistance){
            return 1;
        }
        return
    })
    return uniqueLocations;
}

module.exports = getInRadius