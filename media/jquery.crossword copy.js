(function ($) {
	$.fn.crossword = function (entryData) {
		/*
			Crossword Puzzle: a JavaScript + jQuery crossword puzzle
			"light" refers to a white box - or an input

			DEV NOTES: 
			- activePosition and activeClueIndex are the primary vars that set the UI whenever there's an interaction
			- 'Entry' is a puzzler term used to describe the group of letter inputs representing a word solution
			- This puzzle isn't designed to securely hide answers. A user can see answers in the JS source
				- An XHR provision can be added later to hit an endpoint on keyup to check the answer
			- The ordering of the array of problems doesn't matter. The position & orientation properties are enough information
			- Puzzle authors must provide starting x,y coordinates for each entry
			- Entry orientation must be provided instead of ending x,y coordinates (script could be adjusted to use ending x,y coords)
			- Answers are best provided in lower-case, and cannot have spaces - support can be added later
		*/

		var puzz = {};
		puzz.data = entryData;

		// Append clues markup after puzzle wrapper div
		this.after('<div id="puzzle-clues"><h2>Across</h2><ol id="across"></ol><h2>Down</h2><ol id="down"></ol></div>');

		var tbl = ['<table id="puzzle">'],
			puzzEl = this,
			clues = $('#puzzle-clues'),
			clueLiEls,
			coords,
			entryCount = puzz.data.length,
			entries = [],
			rows = [],
			cols = [],
			solved = [],
			tabindex,
			$actives,
			activePosition = 0,
			activeClueIndex = 0,
			currOri,
			targetInput,
			mode = 'interacting',
			solvedToggle = false,
			z = 0;

		var puzInit = {

			init: function () {
				currOri = 'across'; // App's initial orientation

				// Reorder the problems array ascending by position
				puzz.data.sort(function (a, b) {
					return a.position - b.position;
				});

				// Set up event handlers for the 'entry' inputs
				puzzEl.on('keyup', 'input', function (e) {
					mode = 'interacting';

					// Determine orientation based on arrow keys
					switch (e.which) {
						case 39:
						case 37:
							currOri = 'across';
							break;
						case 38:
						case 40:
							currOri = 'down';
							break;
						default:
							break;
					}

					if (e.keyCode === 9) {
						return false;
					} else if (
						e.keyCode === 37 ||
						e.keyCode === 38 ||
						e.keyCode === 39 ||
						e.keyCode === 40 ||
						e.keyCode === 8 ||
						e.keyCode === 46) {

						if (e.keyCode === 8 || e.keyCode === 46) {
							currOri === 'across' ? nav.nextPrevNav(e, 37) : nav.nextPrevNav(e, 38);
						} else {
							nav.nextPrevNav(e);
						}

						e.preventDefault();
						return false;
					} else {
						console.log('input keyup: ' + solvedToggle);
						puzInit.checkAnswer(e);
					}

					e.preventDefault();
					return false;
				});

				// Tab navigation handler setup
				puzzEl.on('keydown', 'input', function (e) {
					if (e.keyCode === 9) {
						mode = "setting ui";
						if (solvedToggle) solvedToggle = false;
						nav.updateByEntry(e);
					} else {
						return true;
					}
					e.preventDefault();
				});

				// Click handler for inputs
				puzzEl.on('click', 'input', function (e) {
					mode = "setting ui";
					if (solvedToggle) solvedToggle = false;

					console.log('input click: ' + solvedToggle);

					nav.updateByEntry(e);
					e.preventDefault();
				});

				// Click handler for clues
				clues.on('click', 'li', function (e) {
					mode = 'setting ui';

					if (!e.keyCode) {
						nav.updateByNav(e);
					}
					e.preventDefault();
				});

				// Click handler for puzzle cells
				puzzEl.on('click', '#puzzle', function (e) {
					$(e.target).focus();
					$(e.target).select();
				});

				puzInit.calcCoords();

				// Puzzle clues added to DOM in calcCoords(), now focus on first clue
				clueLiEls = $('#puzzle-clues li');
				$('#' + currOri + ' li').eq(0).addClass('clues-active').trigger('focus');

				puzInit.buildTable();
				puzInit.buildEntries();
			},

			// Calculate coordinates for entries and build clues
			calcCoords: function () {
				for (var i = 0; i < entryCount; ++i) {
					entries.push([]);
					var entryLength = puzz.data[i].answer.length;
					for (var x = 0; x < entryLength; ++x) {
						if (puzz.data[i].orientation === 'across') {
							coords = (puzz.data[i].startx++) + ',' + puzz.data[i].starty;
						} else {
							coords = puzz.data[i].startx + ',' + (puzz.data[i].starty++);
						}
						entries[i].push(coords);
					}

					// Add clues to DOM
					$('#' + puzz.data[i].orientation).append('<li tabindex="1" data-position="' + i + '">' + puzz.data[i].clue + '</li>');
				}

				// Calculate grid size
				for (var i = 0; i < entryCount; ++i) {
					for (var x = 0; x < entries[i].length; x++) {
						cols.push(parseInt(entries[i][x].split(',')[0], 10));
						rows.push(parseInt(entries[i][x].split(',')[1], 10));
					}
				}

				rows = Math.max.apply(Math, rows);
				cols = Math.max.apply(Math, cols);
			},

			// Build the puzzle grid
			buildTable: function () {
				for (var i = 1; i <= rows; ++i) {
					tbl.push("<tr>");
					for (var x = 1; x <= cols; ++x) {
						tbl.push('<td data-coords="' + x + ',' + i + '"></td>');
					}
					tbl.push("</tr>");
				}

				tbl.push("</table>");
				puzzEl.append(tbl.join(''));
			},

			// Build entries into the grid
			buildEntries: function () {
				var puzzCells = $('#puzzle td'),
					light,
					$groupedLights,
					hasOffset = false,
					positionOffset = entryCount - puzz.data[puzz.data.length - 1].position;

				for (var x = 1; x <= entryCount; ++x) {
					var letters = puzz.data[x - 1].answer.split('');

					for (var i = 0; i < entries[x - 1].length; ++i) {
						light = puzzCells.filter('[data-coords="' + entries[x - 1][i] + '"]');

						// Check for overlapping entries
						if (x > 1) {
							if (puzz.data[x - 1].position === puzz.data[x - 2].position) {
								hasOffset = true;
							}
						}

						if (light.is(':empty')) {
							light
								.addClass('entry-' + (hasOffset ? x - positionOffset : x) + ' position-' + (x - 1))
								.append('<input maxlength="1" val="" type="text" tabindex="-1" />');
						}
					}
				}

				// Add entry numbers
				for (var i = 1; i <= entryCount; ++i) {
					$groupedLights = $('.entry-' + i);
					if (!$groupedLights.eq(0).find('span').length) {
						$groupedLights.eq(0).append('<span>' + puzz.data[i - 1].position + '</span>');
					}
				}

				util.highlightEntry();
				util.highlightClue();
				$('.active').eq(0).focus();
				$('.active').eq(0).select();
			},

			// Check the current answer
			checkAnswer: function (e) {
				var valToCheck, currVal;

				util.getActivePositionFromClassGroup($(e.target));

				valToCheck = puzz.data[activePosition].answer.toLowerCase();

				currVal = $('.position-' + activePosition + ' input')
					.map(function () {
						return $(this).val().toLowerCase();
					})
					.get()
					.join('');

				if (valToCheck === currVal) {
					$('.active')
						.addClass('done')
						.removeClass('active');

					$('.clues-active').addClass('clue-done');

					solved.push(valToCheck);
					solvedToggle = true;
					return;
				}

				currOri === 'across' ? nav.nextPrevNav(e, 39) : nav.nextPrevNav(e, 40);
			}
		}; // end puzInit object

		var nav = {

			nextPrevNav: function (e, override) {
				var len = $actives.length,
					struck = override ? override : e.which,
					el = $(e.target),
					p = el.parent(),
					ps = el.parents('tr'),
					selector;

				util.getActivePositionFromClassGroup(el);
				util.highlightEntry();
				util.highlightClue();

				$('.current').removeClass('current');

				selector = '.position-' + activePosition + ' input';

				// Move input focus/select to 'next' input
				switch (struck) {
					case 39: // Right arrow
						p.next().find('input').addClass('current').select();
						break;

					case 37: // Left arrow
						p.prev().find('input').addClass('current').select();
						break;

					case 40: // Down arrow
						ps.next('tr').find(selector).addClass('current').select();
						break;

					case 38: // Up arrow
						ps.prev('tr').find(selector).addClass('current').select();
						break;

					default:
						break;
				}
			},

			updateByNav: function (e) {
				var target;

				$('.clues-active').removeClass('clues-active');
				$('.active').removeClass('active');
				$('.current').removeClass('current');
				currIndex = 0;

				target = e.target;
				activePosition = $(e.target).data('position');

				util.highlightEntry();
				util.highlightClue();

				$('.active').eq(0).focus();
				$('.active').eq(0).select();
				$('.active').eq(0).addClass('current');

				// Store orientation for auto-selecting next input
				currOri = $('.clues-active').parent('ol').attr('id');

				activeClueIndex = clueLiEls.index(e.target);
			},

			// Sets activePosition var and adds active class to current entry
			updateByEntry: function (e, next) {
				var classes, clue, e1Ori, e2Ori, e1Cell, e2Cell;

				if (e.keyCode === 9 || next) {
					// Handle tabbing through problems
					activeClueIndex = activeClueIndex === clueLiEls.length - 1 ? 0 : ++activeClueIndex;

					$('.clues-active').removeClass('clues-active');

					next = clueLiEls.eq(activeClueIndex);
					currOri = next.parent().attr('id');
					activePosition = next.data('position');

					// Skip already-solved problems
					util.getSkips(activeClueIndex);
					activePosition = clueLiEls.eq(activeClueIndex).data('position');
				} else {
					activeClueIndex = activeClueIndex === clueLiEls.length - 1 ? 0 : ++activeClueIndex;

					util.getActivePositionFromClassGroup(e.target);

					clue = clueLiEls.filter('[data-position=' + activePosition + ']');
					activeClueIndex = clueLiEls.index(clue);

					currOri = clue.parent().attr('id');
				}

				util.highlightEntry();
				util.highlightClue();
			}
		}; // end nav object

		var util = {
			highlightEntry: function () {
				$actives = $('.active');
				$actives.removeClass('active');
				$actives = $('.position-' + activePosition + ' input').addClass('active');
				$actives.eq(0).focus();
				$actives.eq(0).select();
			},

			highlightClue: function () {
				var clue;
				$('.clues-active').removeClass('clues-active');
				clueLiEls.filter('[data-position=' + activePosition + ']').addClass('clues-active');

				if (mode === 'interacting') {
					clue = clueLiEls.filter('[data-position=' + activePosition + ']');
					activeClueIndex = clueLiEls.index(clue);
				}
			},

			getClasses: function (light, type) {
				if (!light.length) return false;

				var classAttr = light.attr('class') || '',
					classes = classAttr.split(' '),
					classLen = classes.length,
					positions = [];

				// Extract position classes
				for (var i = 0; i < classLen; ++i) {
					if (!classes[i].indexOf(type)) {
						positions.push(classes[i]);
					}
				}

				return positions;
			},

			getActivePositionFromClassGroup: function (el) {
				var classes = util.getClasses(el.parent(), 'position'),
					e1Ori, e2Ori, e1Cell, e2Cell;

				if (classes.length > 1) {
					// Get orientation for each reported position
					e1Ori = clueLiEls.filter('[data-position=' + classes[0].split('-')[1] + ']').parent().attr('id');
					e2Ori = clueLiEls.filter('[data-position=' + classes[1].split('-')[1] + ']').parent().attr('id');

					// Test if clicked input is first in series
					e1Cell = $('.position-' + classes[0].split('-')[1] + ' input').index(el);
					e2Cell = $('.position-' + classes[1].split('-')[1] + ' input').index(el);

					if (mode === "setting ui") {
						currOri = e1Cell === 0 ? e1Ori : e2Ori;
					}

					if (e1Ori === currOri) {
						activePosition = classes[0].split('-')[1];
					} else if (e2Ori === currOri) {
						activePosition = classes[1].split('-')[1];
					}
				} else {
					activePosition = classes[0].split('-')[1];
				}

				console.log('getActivePositionFromClassGroup activePosition: ' + activePosition);
			},

			checkSolved: function (valToCheck) {
				for (var i = 0; i < solved.length; i++) {
					if (valToCheck === solved[i]) {
						return true;
					}
				}
			},

			getSkips: function (position) {
				if (clueLiEls.eq(position).hasClass('clue-done')) {
					activeClueIndex = position === clueLiEls.length - 1 ? 0 : ++activeClueIndex;
					util.getSkips(activeClueIndex);
				} else {
					return false;
				}
			}
		}; // end util object

		puzInit.init();
	};
})(jQuery);
