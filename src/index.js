import idMapper from "./idMapper";

addEventListener('scheduled', event => {
  event.waitUntil(
    handleSchedule(event.scheduledTime)
  )
})

/**
 * Generates the HTML-code for the given parameters based on the designed template.
 * @param {TMDBShowObject} show The show the selected episode belongs to.
 * @param {TMDBEpisodeObject} episode The randomly selected episode.
 * @param {TMDBSeasonObject} season The season the selected episode belongs to.
 * @param {string} linkButtons The HTML-code for the link-buttons (to the streaming services).
 * @returns {string} HTML-Code of the web page with the selected episode.
 */
function getEpisodeHTML(show, episode, season, linkButtons) {
  const time = new Date().toLocaleString();

  return `
  <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
  <HTML>
    <HEAD>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
      <TITLE>Aktuelle Episode: ${show.name} - ${episode.name}</TITLE>
    </HEAD>
    <BODY style="width: 95%; max-width: 800px; color: #ededed; text-shadow: 3px 3px 10px black; background-color:#1c1c1c; font-family: Helvetica, Arial, sans-serif; margin: 0 auto; padding: 70px 0;">
      <table>
        <div style="display: flex;">
          <img style="height: 300px; box-shadow: 0px 0px 3px black; border-radius: 10px; margin-right: -20px" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${show.poster_path}" alt="show-image">
          <img style="height: 250px; box-shadow: 0px 0px 3px black; border-radius: 10px; margin-top: 40px;" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${season.poster_path}" alt="show-image">
        </div>
      </table> 
      <H1>${show.name}</H1>
      <H2>
        ${episode.name}, S${episode.season_number}, E${episode.episode_number}
      </H2>
      <img style="width: 100%; max-width: 600px; box-shadow: 0px 0px 3px black;" src="https://image.tmdb.org/t/p/w454_and_h254_bestv2${episode.still_path}" alt="show-image">
      <div style="width: 100%; margin-top: -60px; display: flex; justify-content: flex-end;">
        ${linkButtons}
      </div>
      <ul>
        <li>
          Länge: ${episode.runtime} min.
        </li>
        <li>
          Erstaustrahlung: ${episode.air_date}
        </li>
      </ul>
      <p style="font-size: 0.7rem; margin-top: 50px;">
        Aktualisiert: ${time}
      </p>
    </BODY>
  </HTML>
  `
}

/**
 * Can be used to get the HTML-code for a single image button to a streaming service.
 * @param {string} url The URL to the show at the streaming service.
 * @param {string} imageUrl The image-URL for the streaming service.
 * @returns {string} The HTML-code for the image button.
 */
function getImageButton(url, imageUrl) {
  return `<img style="box-shadow: 0px 0px 3px black; cursor: pointer; width: 75px; height: 75px; border-radius: 10px; margin-right: 20px;" src="https://image.tmdb.org/t/p/w300_and_h300_bestv2${imageUrl}" alt="streaming-service-image" onclick="window.open('${url}', '_blank')">`
}

/**
 * Used to get the HTML-code for all available links to streaming services for a given series.
 * @param {TMDBWatchProviderObject} germanFlatrateWatchProviders The TMDB-object of the watch provider.
 * @param {string} seriesId The ID of the randomly selected show/series.
 * @returns {string} The HTML-code for alle image-buttons to all streaming services.
 */
function getLinkButtons(germanFlatrateWatchProviders, seriesId) {
  let imageButtons = "";
  for (const provider of germanFlatrateWatchProviders) {
    if (seriesId in idMapper) {
      if (provider.provider_name in idMapper[seriesId]) {
        const streamingServiceId = idMapper[seriesId][provider.provider_name];
        let streamingServiceUrl;
        switch (provider.provider_name) {
          case "Netflix":
            streamingServiceUrl = `https://www.netflix.com/title/${streamingServiceId}`;
            break;
          case "Amazon Prime Video":
            streamingServiceUrl = `https://www.amazon.de/${streamingServiceId}`;
            break;
          case "Disney Plus":
            streamingServiceUrl = `https://www.disneyplus.com/en-gb/series/${streamingServiceId}`;
            break;
        }
        imageButtons = imageButtons + getImageButton(streamingServiceUrl, provider.logo_path);
      }
    }
  }
  return imageButtons;
}

/**
 * Can be used to generate the HTML-code for an error page.
 * @param {string} errorLocation Where the error occured or a further description for the error.
 * @returns {string} The HTML-code for an complete error page.
 */
function getError(errorLocation) {
  const time = new Date().toLocaleString();
  return `
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
    <HTML>
      <HEAD>
        <TITLE>Error</TITLE>
      </HEAD>
      <BODY style="font-family: Arial, Helvetica, sans-serif; margin: 0 auto; width: 80%; padding: 70px 0;">
      <p>An error occured:</p>
      <ul>
        <li>Location/Info: ${errorLocation}</li>
        <li>Time: ${time}</li>
      </ul>
      </BODY>
  </HTML>
  `
}

/**
 * Call this to trigger the linked Github-action which rebuilds the Github pages page with the given content.
 * @param {string} content HTML-code that should be on the page (needs to be code for a complete page). 
 */
async function triggerGithubWebHook(content) {
  await fetch('https://api.github.com/repos/adeveloper-wq/my-tv-series-bot/dispatches', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github.everest-preview+json',
      'User-Agent': "My-TV-Series-Bot",
      'Authorization': `token ${GITHUB_PERSONAL_ACCESS_TOKEN}`
    },
    body: JSON.stringify(
      {
        event_type: "new_episode_trigger",
        client_payload: {
          new_episode_page: content
        }
      }
    )
  });
}


/**
 * Use this to communicate with the TMDB-API
 * @param {string} endpoint The specific endpoint.
 * @param {string} description A custom description of the endpoint (used for the error-page if something fails).
 * @param {boolean} arrayExpected A boolean which is used to check the response (check whether an array or object gets returned). If the opposite of the boolean gets returned, an error is triggered.
 * @returns {object} Returns an object containing either an error or the expected body.
 */
async function callTMDBApi(endpoint, description, arrayExpected) {
  let response;
  let indexContent;

  await fetch(`https://api.themoviedb.org/${endpoint}?language=de-DE`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Authorization': `Bearer ${TMDB_V4_ACCESS_TOKEN}`
    }
  }).then((response) => {
    console.log(response);
    if (response.ok) {
      return response.json();
    }
    throw new Error(getError(description));
  })
    .then((responseJson) => {
      console.log(responseJson);
      if (!Array.isArray(responseJson) && arrayExpected) {
        throw new Error(getError(`${description} Returned object is not an array.`));
      }
      if (Array.isArray(responseJson) && !arrayExpected) {
        throw new Error(getError(`${description} Returned object is an array (shouldn't be).`));
      }
      response = responseJson;
    })
    .catch((error) => {
      indexContent = error;
    });

  if (response) {
    console.log("Successful fetch.")
    return { body: response }
  } else {
    console.log("Error during fetch fetch.")
    return { indexContent: indexContent }
  }
}

/**
 * Use this to generate a random number.
 * @param {int} min The lower border of the range (inclusive).
 * @param {int} max The upper border of the range (exclusive).
 * @returns {int} The random number.
 */
function getRandomArbitrary(min, max) {
  max = max - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function handleSchedule(scheduledDate) {

  // Get the list with all the shows in it.
  console.log("Fetching list data.")
  let response = await callTMDBApi(`4/list/${TMDB_LIST_ID}`, "Getting the shows in the list.", false)
  if (response.indexContent) {
    console.log(`Error: ${response.indexContent}`)
    await triggerGithubWebHook(response.indexContent);
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (!response.body.results) {
    await triggerGithubWebHook(getError("Response from the list-endpoint doesn't contain the shows."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (response.body.total_pages !== 1) {
    await triggerGithubWebHook(getError("Too many shows. The code needs to be updated."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  // Select a random show.
  const numberOfShows = response.body.total_results;
  const randomShow = response.body.results[getRandomArbitrary(0, numberOfShows)];
  const ranomShowId = randomShow.id;

  // Get the  seasons for the selected show.
  console.log("Fetching show data.")
  response = await callTMDBApi(`3/tv/${ranomShowId}`, "Getting the seasons and show information.", false)

  if (response.indexContent) {
    console.log(`Error: ${response.indexContent}`)
    await triggerGithubWebHook(response.indexContent);
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (!response.body.seasons) {
    await triggerGithubWebHook(getError("Response from the show-endpoint doesn't contain the seasons."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  // Select a random season.
  const show = response.body;
  const numberOfSeasons = show.number_of_seasons;
  const randomSeason = show.seasons[getRandomArbitrary(1, numberOfSeasons)];
  const ranomSeasonNumber = randomSeason.season_number;

  // Get the episodes for the selected season.
  console.log("Fetching season data.")
  response = await callTMDBApi(`3/tv/${ranomShowId}/season/${ranomSeasonNumber}`, "Getting the season informations and episodes of season.", false)

  if (response.indexContent) {
    console.log(`Error: ${response.indexContent}`)
    await triggerGithubWebHook(response.indexContent);
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (!response.body.episodes) {
    await triggerGithubWebHook(getError("Response from the season-endpoint doesn't contain the episodes."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  // Select a random episode.
  const season = response.body;
  const numberOfEpisodes = season.episodes.length;
  const randomEpisode = season.episodes[getRandomArbitrary(0, numberOfEpisodes)];
  const ranomEpisodeNumber = randomEpisode.episode_number;

  // Get the data for the selected episode.
  console.log("Fetching episode data.")
  response = await callTMDBApi(`3/tv/${ranomShowId}/season/${ranomSeasonNumber}/episode/${ranomEpisodeNumber}`, "Getting the episode informations.", false)

  if (response.indexContent) {
    console.log(`Error: ${response.indexContent}`)
    await triggerGithubWebHook(response.indexContent);
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (!response.body.name) {
    await triggerGithubWebHook(getError("Response from the episode-endpoint doesn't contain the field 'name'."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  const episode = response.body;

  // Get the providers that have the selected show.
  console.log("Fetching watch providers.")
  response = await callTMDBApi(`3/tv/${ranomShowId}/watch/providers`, "Getting the show watch provider informations.", false)

  if (response.indexContent) {
    await triggerGithubWebHook(response.indexContent);
    return new Response("Triggered Github Actions to update Github pages.")
  }

  if (!response.body.results.DE) {
    await triggerGithubWebHook(getError("Response from the watch-provider-endpoint doesn't contain the field 'DE'."));
    return new Response("Triggered Github Actions to update Github pages.")
  }

  const germanFlatrateWatchProviders = response.body.results.DE.flatrate

  // Generate the HTML-page and trigger a rebuild.
  console.log("Generating HTML.")
  await triggerGithubWebHook(getEpisodeHTML(show, episode, season, getLinkButtons(germanFlatrateWatchProviders, show.id)));
  return new Response("Triggered Github Actions to update Github pages.")
}
