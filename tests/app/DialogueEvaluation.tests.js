'use strict';

QUnit.module( 'DialogueEvaluation' );

var $ = require( 'jquery' ),
	DialogueEvaluation = require( '../../js/app/DialogueEvaluation' ),
	Asset = require( '../../js/app/Asset' ),
	Messages = require( '../../js/app/Messages' ),
	LicenceStore = require( '../../js/app/LicenceStore' ),
	licences = new LicenceStore( require( '../../js/app/LICENCES' ) ),
	Author = require( '../../js/app/Author' );

function newEvaluation( asset, dialogueData ) {
	return new DialogueEvaluation(
		new Asset(
			'',
			'',
			asset.licence || licences.getLicence( 'cc' ),
			asset.title || '',
			asset.authors || [ '' ],
			asset.url || '',
			asset.attribution || $( '<div/>' )
		),
		dialogueData || {}
	);
}

function attributionContains( evaluation, text ) {
	return evaluation.getAttribution().indexOf( text ) !== -1;
}

QUnit.test( 'responds to getAttribution', function( assert ) {
	assert.ok( typeof newEvaluation( {} ).getAttribution() === 'string' );
} );

QUnit.test( 'attribution contains asset title', function( assert ) {
	assert.ok( attributionContains( newEvaluation( { title: 'Test' } ), 'Test' ) );
} );

QUnit.test( 'attribution contains asset url for use in print', function( assert ) {
	var url = 'https://commons.wikimedia.org/wiki/File:Eichh%C3%B6rnchen_D%C3%BCsseldorf_Hofgarten_edit.jpg',
		evaluation = newEvaluation( { url: url }, { 'typeOfUse': { type: 'print' } } );
	assert.ok( attributionContains( evaluation, url ) );
} );

QUnit.test( 'print attribution does not contain title if licence is CC 4 ', function( assert ) {
	var licence = licences.getLicence( 'cc-by-4.0' ),
		evaluation = newEvaluation( { licence: licence, title: 'Foo' }, { 'typeOfUse': { type: 'print' } } );
	assert.notOk( attributionContains( evaluation, 'Foo' ) );
} );

QUnit.test( 'online attribution contains title even if licence is CC 4 ', function( assert ) {
	var licence = licences.getLicence( 'cc-by-4.0' ),
		evaluation = newEvaluation( { licence: licence, title: 'Foo' }, { 'typeOfUse': { type: 'online' } } );
	assert.ok( attributionContains( evaluation, 'Foo' ) );
} );

QUnit.test( 'print attribution contains licence URL', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation( { licence: licence }, { 'typeOfUse': { type: 'print' } } );
	assert.ok( attributionContains( evaluation, licence.getUrl() ) );
} );

QUnit.test( 'use different licence URL if the user edited the asset and uses a compatible licence', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		compatibleLicence = licences.getLicence( 'cc-by-3.0-de' ),
		evaluation = newEvaluation(
			{ licence: licence },
			{
				'typeOfUse': { type: 'print' },
				'editing': { edited: 'true' },
				'licence': { licence: compatibleLicence.getId() }
			} );
	assert.ok( attributionContains( evaluation, compatibleLicence.getUrl() ) );
} );

QUnit.test( 'attribution contains the author', function( assert ) {
	var authorName = 'Meh',
		author = new Author( $( '<div>' + authorName + '</div>' ) ),
		evaluation = newEvaluation( { authors: [ author ] } ),
		printEvaluation = newEvaluation( { authors: [ author ] }, { 'typeOfUse': { type: 'print' } } );
	assert.ok( attributionContains( evaluation, authorName ) );
	assert.ok( attributionContains( printEvaluation, authorName ) );
} );

QUnit.test( 'attribution contains editing information if it was edited', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'print' },
				editing: { edited: 'true' },
				licence: { licence: licence.getId() },
				change: { change: 'zugeschnitten' },
				creator: { name: 'Meh' }
			}
		);

	assert.ok( attributionContains( evaluation, 'zugeschnitten von Meh, ' + licence.getUrl() ) );
} );

QUnit.test( 'attribution contains default change name if asset was edited but no change description has been provided', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'print' },
				editing: { edited: 'true' },
				licence: { licence: licence.getId() },
				creator: { name: 'Meh' }
			}
		);

	assert.ok( attributionContains( evaluation, Messages.t( 'evaluation.edited' ) + ' ' + Messages.t( 'evaluation.by' ) + ' Meh, ' + licence.getUrl() ) );
} );

QUnit.test( 'attribution contains only change name if asset was edited but maker of changes has not been provided', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'print' },
				editing: { edited: 'true' },
				licence: { licence: licence.getId() },
				change: { change: 'zugeschnitten' }
			}
		);

	assert.ok( attributionContains( evaluation, 'zugeschnitten, ' + licence.getUrl() ) );
	assert.notOk( attributionContains( evaluation, ' ' + Messages.t( 'evaluation.by' ) + ' ' ) );
} );

QUnit.test( 'attribution contains only change name if asset was edited but no change description nor author of changes have been provided', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'print' },
				editing: { edited: 'true' },
				licence: { licence: licence.getId() }
			}
		);

	assert.ok( attributionContains( evaluation, Messages.t( 'evaluation.edited' ) + ', ' + licence.getUrl() ) );
	assert.notOk( attributionContains( evaluation, ' ' + Messages.t( 'evaluation.by' ) + ' ' ) );
} );

QUnit.test( 'online attribution contains author\'s html', function( assert ) {
	var authorUrl = 'https://commons.wikimedia.org/wiki/User:Foo',
		author = 'Foo',
		evaluation = newEvaluation( { authors: [ new Author( $( '<a href="' + authorUrl + '">' + author + '</a>' ) ) ] } );
	assert.ok( attributionContains( evaluation, '<a href="' + authorUrl + '" target="_blank">' + author + '</a>' ) );
} );

QUnit.test( 'online attribution contains link to asset from title', function( assert ) {
	var url = 'http://example.com/foo.jpg',
		title = 'bar',
		evaluation = newEvaluation( { url: url, title: title } );
	assert.ok( attributionContains( evaluation, '<a href="' + url + '" target="_blank">' + title + '</a>' ) );
} );

QUnit.test( 'online attribution contains link to licence', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation( { licence: licence } );
	assert.ok( attributionContains( evaluation, '<a href="' + licence.getUrl() + '" rel="license" target="_blank">' + licence.getName() + '</a>' ) );
} );

QUnit.test( 'online attribution contains editing information', function( assert ) {
	var licence = licences.getLicence( 'cc-by-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'online' },
				editing: { edited: 'true' },
				licence: { licence: licence.getId() },
				change: { change: 'zugeschnitten' },
				creator: { name: 'Meh' }
			}
		);

	assert.ok( attributionContains( evaluation, 'zugeschnitten von Meh, ' ) );
} );

QUnit.test( 'attribution does not contain editing information if it was not edited', function( assert ) {
	var evaluation = newEvaluation( {}, { editing: { edited: 'false' }, change: { change: 'blah' } } );
	assert.notOk( attributionContains( evaluation, 'blah' ) );
} );

QUnit.test( 'attribution shows "anonymous" for unknown author', function( assert ) {
	var evaluation = newEvaluation( {}, { author: { 'no-author': 'true' } } );
	assert.ok( attributionContains( evaluation, Messages.t( 'evaluation.anonymous' ) ) );
} );

QUnit.test( 'online attribution shows the author the user entered', function( assert ) {
	var evaluation = newEvaluation( {}, { author: { author: 'Meh' } } );
	assert.ok( attributionContains( evaluation, 'Meh' ) );
} );

QUnit.test( 'online attribution has no duplicate comma', function( assert ) {
	var licence = licences.getLicence( 'cc-by-sa-3.0' ),
		evaluation = newEvaluation(
			{},
			{
				'typeOfUse': { type: 'online' },
				editing: { edited: 'false' },
				licence: { licence: licence.getId() }
			}
		);
	assert.ok( !attributionContains( evaluation, ', ,' ) );
} );

QUnit.test( 'plain text attribution for online usage is generated correctly', function( assert ) {
	var evaluation = newEvaluation(
		{
			authors: [ new Author( $( '<a href="https://commons.wikimedia.org/wiki/User:Foo">Foo</a>' ) ) ],
			licence: licences.getLicence( 'cc-by-3.0' ),
			title: 'Bar',
			url: 'https://commons.wikimedia.org/wiki/File:Baz.jpg'
		},
		{ 'typeOfUse': { type: 'online' } }
	),
		expectedAttribution = 'Foo (https://commons.wikimedia.org/wiki/File:Baz.jpg), „Bar“, https://creativecommons.org/licenses/by/3.0/legalcode';
	assert.equal( evaluation.getPlainTextAttribution(), expectedAttribution );
} );

QUnit.test( 'plain text attribution for print usage is the same as the normal attribution', function( assert ) {
	var evaluation = newEvaluation(
		{
			authors: [ new Author( $( '<a href="https://commons.wikimedia.org/wiki/User:Foo">Foo</a>' ) ) ],
			licence: licences.getLicence( 'cc-by-3.0' ),
			title: 'Bar',
			url: 'https://commons.wikimedia.org/wiki/File:Baz.jpg'
		},
		{ 'typeOfUse': { type: 'print' } }
	);
	assert.equal( evaluation.getPlainTextAttribution(), evaluation.getAttribution() );
} );

QUnit.test( 'attribution should contain an alternative attribution if the author provided one', function( assert ) {
	var evaluation = newEvaluation( { authors: [ 'Meh' ], attribution: $( '<div>Meehh</div>' ) }, {} );
	assert.notOk( attributionContains( evaluation, 'Meh' ) );
	assert.ok( attributionContains( evaluation, 'Meehh' ) );
} );

QUnit.test( 'has type of use information in the DOs section', function( assert ) {
	var printEvaluation = newEvaluation( {}, { 'typeOfUse': { type: 'print' } } ),
		onlineEvaluation = newEvaluation( {}, { 'typeOfUse': { type: 'online' } } );

	assert.ok( printEvaluation.getDosAndDonts().dos.indexOf( 'print' ) !== -1 );
	assert.ok( printEvaluation.getDosAndDonts().dos.indexOf( 'online' ) === -1 );

	assert.ok( onlineEvaluation.getDosAndDonts().dos.indexOf( 'online' ) !== -1 );
	assert.ok( onlineEvaluation.getDosAndDonts().dos.indexOf( 'print' ) === -1 );
} );

QUnit.test( 'has compilation hint in the DOs section', function( assert ) {
	var evaluation = newEvaluation( {}, { compilation: { compilation: 'true' } } );
	assert.ok( evaluation.getDosAndDonts().dos.indexOf( 'compilation' ) !== -1 );
} );

QUnit.test( 'has all DONTs by default', function( assert ) {
	var evaluation = newEvaluation( { licence: licences.getLicence( 'cc-by-3.0' ) } );
	assert.deepEqual(
		evaluation.getDosAndDonts().donts,
		[ 'terms-of-use', 'sublicences', 'cc-licence', 'technical-protection', 'rightholder-connection' ]
	);
} );

QUnit.test( 'does not have rightholder connection in DONTs for licence version <=2.0', function( assert ) {
	var evaluation = newEvaluation( { licence: licences.getLicence( 'cc-by-2.0' ) } );
	assert.ok( evaluation.getDosAndDonts().donts.indexOf( 'rightholder-connection' ) === -1 );
} );

QUnit.test( 'isPrint tells whether the asset is going to be used in a print medium', function( assert ) {
	var printEvaluation = newEvaluation( {}, { 'typeOfUse': { type: 'print' } } ),
		onlineEvaluation = newEvaluation( {}, { 'typeOfUse': { type: 'online' } } );

	assert.ok( printEvaluation.isPrint() );
	assert.notOk( onlineEvaluation.isPrint() );
} );
