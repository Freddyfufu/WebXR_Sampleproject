

import * as THREE from 'three';
import * as ThreeMeshUI from "three-mesh-ui";




const objsToTest = [];

// Colors

const colors = {
	keyboardBack: 0x858585,
	panelBack: 0x262626,
	button: 0x363636,
	hovered: 0x1c1c1c,
	selected: 0x109c5d
};

//





let selectState = false;
let touchState = false;



window.addEventListener( 'pointerdown', () => {

	selectState = true;

} );

window.addEventListener( 'pointerup', () => {

	selectState = false;

} );

window.addEventListener( 'touchstart', ( event ) => {

	touchState = true;

} );

window.addEventListener( 'touchend', () => {

	touchState = false;


} );

let userText, currentLayoutButton, layoutOptions, keyboard;





export function makeQuizboard() {

	const container = new THREE.Group();
	container.position.set( 0, 1.4, -1.2 );
	container.rotation.x = -0.15;

	//////////////
	// TEXT PANEL
	//////////////

	const textPanel = new ThreeMeshUI.Block( {
		width: 1,
		height: 0.35,
		backgroundColor: new THREE.Color( colors.panelBack ),
		backgroundOpacity: 1
	} );

	textPanel.position.set( 0, -0.15, 0 );
	container.add( textPanel );

	//

	const title = new ThreeMeshUI.Block( {
		width: 1,
		height: 0.1,
		justifyContent: 'center',
		fontSize: 0.045,
		backgroundOpacity: 0
	} ).add(
		new ThreeMeshUI.Text( { content: 'Type some text on the keyboard' } )
	);

	userText = new ThreeMeshUI.Text( { content: '' } );

	const textField = new ThreeMeshUI.Block( {
		width: 1,
		height: 0.4,
		fontSize: 0.033,
		padding: 0.02,
		backgroundOpacity: 0
	} ).add( userText );

	textPanel.add( title, textField );

	////////////////////////
	// LAYOUT OPTIONS PANEL
	////////////////////////

	// BUTTONS

	let layoutButtons = [
		[ 'English', 'eng' ],
		[ 'Nordic', 'nord' ],
		[ 'German', 'de' ],
		[ 'Spanish', 'es' ],
		[ 'French', 'fr' ],
		[ 'Russian', 'ru' ],
		[ 'Greek', 'el' ]
	];

	layoutButtons = layoutButtons.map( ( options ) => {

		const button = new ThreeMeshUI.Block( {
			height: 0.06,
			width: 0.2,
			margin: 0.012,
			justifyContent: 'center',
			backgroundColor: new THREE.Color( colors.button ),
			backgroundOpacity: 1
		} ).add(
			new ThreeMeshUI.Text( {
				offset: 0,
				fontSize: 0.035,
				content: options[ 0 ]
			} )
		);

		button.setupState( {
			state: 'idle',
			attributes: {
				offset: 0.02,
				backgroundColor: new THREE.Color( colors.button ),
				backgroundOpacity: 1
			}
		} );

		button.setupState( {
			state: 'hovered',
			attributes: {
				offset: 0.02,
				backgroundColor: new THREE.Color( colors.hovered ),
				backgroundOpacity: 1
			}
		} );

		button.setupState( {
			state: 'selected',
			attributes: {
				offset: 0.01,
				backgroundColor: new THREE.Color( colors.selected ),
				backgroundOpacity: 1
			},
			onSet: () => {
				console.log( 'Selected layout:', options[ 1 ] );
				// enable intersection checking for the previous layout button,
				// then disable it for the current button

				if ( currentLayoutButton ) objsToTest.push( currentLayoutButton );

				currentLayoutButton = button;


			}

		} );

		objsToTest.push( button );

		// Set English button as selected from the start

		if ( options[ 1 ] === 'eng' ) {

			button.setState( 'selected' );

			currentLayoutButton = button;

		}

		return button;

	} );

	// CONTAINER

	layoutOptions = new ThreeMeshUI.Block( {

		height: 0.25,
		width: 1,
		offset: 0,
		backgroundColor: new THREE.Color( colors.panelBack ),
		backgroundOpacity: 1
	} ).add(
		new ThreeMeshUI.Block( {
			height: 0.1,
			width: 0.6,
			offset: 0,
			justifyContent: 'center',
			backgroundOpacity: 0
		} ).add(
			new ThreeMeshUI.Text( {
				fontSize: 0.04,
				content: 'Select a keyboard layout :'
			} )
		),

		new ThreeMeshUI.Block( {
			height: 0.075,
			width: 1,
			offset: 0,
			contentDirection: 'row',
			justifyContent: 'center',
			backgroundOpacity: 0
		} ).add(
			layoutButtons[ 0 ],
			layoutButtons[ 1 ],
			layoutButtons[ 2 ],
			layoutButtons[ 3 ]
		),

		new ThreeMeshUI.Block( {
			height: 0.075,
			width: 1,
			offset: 0,
			contentDirection: 'row',
			justifyContent: 'center',
			backgroundOpacity: 0
		} ).add(
			layoutButtons[ 4 ],
			layoutButtons[ 5 ],
			layoutButtons[ 6 ]
		)
	);

	layoutOptions.position.set( 6, 0.2, -2 );
	container.add( layoutOptions );
	objsToTest.push( layoutOptions );
	return container;

}

