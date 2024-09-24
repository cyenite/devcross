import { generateLayout } from './layout_generator.js';

(function ($) {
	$(document).ready(function () {
		// Get the API key from the data attribute of the body tag
		const apiKey = document.body.dataset.apiKey;

		if (!apiKey) {
			console.error("API key is missing.");
			$('#puzzle-wrapper').html('<p>Error: API key is not available.</p>');
			return;
		}

		$('#loader').show();

		// Start the crossword generation process
		fetchCrosswordData()
			.done(function (response) {

				$('#loader').hide();

				var puzzleData = generateLayout(response.data, 15);
				var puzzleDataArray = extractPuzzleDataArray(puzzleData.result);

				$('#puzzle-wrapper').crossword(puzzleDataArray);
			})
			.fail(function (error) {
				$('#loader').hide();
				handleError(error);
			});

		/**
		 * Fetch crossword data from the Gemini API.
		 * @returns {jQuery.Deferred} A deferred object representing the AJAX request.
		 */
		function fetchCrosswordData() {
			var deferred = $.Deferred();
			var prompt = getCrosswordPrompt();

			$.ajax({
				url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
				type: 'POST',
				dataType: 'json',
				contentType: 'application/json',
				data: JSON.stringify({
					"contents": [
						{
							"parts": [{ "text": prompt }]
						}
					]
				}),
				success: function (data, textStatus, jqXHR) {
					try {
						if (data.error) {
							console.error('Error from AI API:', data.error);
							deferred.reject({
								error: new Error(data.error.message),
								statusCode: jqXHR.status
							});
							return;
						}

						var aiResponseText = extractJsonFromApiResponse(data);
						var words_json = JSON.parse(aiResponseText);
						deferred.resolve({
							data: words_json,
							statusCode: jqXHR.status
						});
					} catch (err) {
						console.error('Error processing API response:', err);
						deferred.reject({
							error: err,
							statusCode: jqXHR.status
						});
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					console.error('AJAX request failed:', textStatus, errorThrown);
					deferred.reject({
						error: new Error(textStatus),
						statusCode: jqXHR.status
					});
				}
			});

			return deferred.promise();
		}


		/**
		 * Prepare the crossword prompt text for the API.
		 * @returns {string} The prompt used to request crossword entries.
		 */
		function getCrosswordPrompt() {
			return `
                Please generate an array containing 50 crossword entries. Each entry should be a JSON object with two properties:
				1. "answer": A single word in uppercase letters without any spaces or special characters. The word should be suitable for a 15 x 15 crossword puzzle and can come from technology and developer related categories such as flutter mobile development, react, kotlin, devops and backend development.
				2. "clue": A concise and clear clue corresponding to the answer. The clue should help a person solve the crossword but should not be too obvious.
				Format the array exactly as shown in the example below, including the structure: (The answers and clues are examples should be different in the final array)
				[
					{ "answer": "PYTHON", "clue": "Popular programming language" },
					{ "answer": "JAVASCRIPT", "clue": "Language of the web" },
					// Continue adding entries until there are 50 in total
				]
				Requirements:
				- Total Entries: The final array should contain exactly 50 entries.
				- Formatting: Ensure the formatting matches the example, including commas, braces, quotation marks, and indentation.
				- Uniqueness: Each "answer" should be unique within the array.
				- Content: The words should be appropriate for a general audience and free from offensive or sensitive content.
				- Categories: Include a mix of categories to make the crossword diverse and interesting.
				Please provide the completed array in valid JSON format, containing only the array of entries (starting with [ and ending with ]), without any variable declarations, additional text, or explanations.
            `;
		}

		/**
		 * Extracts the JSON array from the Gemini API response.
		 * @param {Object} responseData - The raw data from the Gemini API response.
		 * @returns {string} The JSON array string from the AI's response.
		 * @throws Will throw an error if the response structure is invalid.
		 */
		function extractJsonFromApiResponse(responseData) {
			try {
				return responseData.candidates[0].content.parts[0].text;
			} catch (err) {
				throw new Error('Unexpected API response structure.');
			}
		}

		/**
		 * Extracts puzzle data into an array from the result object.
		 * @param {Object} result - The result object from generateLayout.
		 * @returns {Array} Array of puzzle data.
		 */
		function extractPuzzleDataArray(result) {
			var puzzleDataArray = [];
			for (var key in result) {
				if (result.hasOwnProperty(key)) {
					puzzleDataArray.push(result[key]);
				}
			}
			return puzzleDataArray;
		}

		/**
		 * Handles errors by displaying a user-friendly message.
		 */
		function handleError(error) {
			if (error.statusCode === 403 || error.statusCode === 400) {
				$('#puzzle-wrapper').html('<p>Error: Invalid API key. Please check the API key and try again.</p>');
				$('#puzzle-wrapper').css('text-align', 'center', 'font-weight', 'bold', 'font-size', '20px');
				return;
			}

			$('#puzzle-wrapper').html('<p>Error generating crossword puzzle. Please try again later.</p>');
		}
	});
})(jQuery);
