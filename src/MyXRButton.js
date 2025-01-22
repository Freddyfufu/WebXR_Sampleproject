class MyXRButton {
    static createButton(renderer, xr_string, btn_string, sessionInit = {}, cbOnSelectStart, cbOnSelectEnd, cbOnSessionStart, cbOnSessionEnd) {
        const button = document.createElement('button');
        let myrefspace = null;
        let mySession = null;

        function showEnterVR( /*device*/) {
            async function onSessionStarted(session) {
                console.log('MyVRButton.js: onSessionStarted() - session:', session);
                await renderer.xr.setSession(session);
                renderer.xr.enabled = true;
                button.textContent = 'EXIT' + btn_string;
                mySession = session;
                session.requestReferenceSpace("local").then((refSpace) => {
                    myrefspace = refSpace;
                    console.log("Reference space set to: ", refSpace);
                });
                cbOnSessionStart(session);
                session.addEventListener('end', onSessionEnded);
                mySession.addEventListener('selectstart', cbOnSelectStart);
                mySession.addEventListener('selectend', cbOnSelectEnd);
                // mySession.addEventListener('start', cbOnSessionStart);
                mySession.addEventListener('end', cbOnSessionEnd);
                mySession.isImmersive = true;


                console.log('MyVRButton.js: onSessionStarted() - MyVRButton.referenceSpace:', myrefspace);
            }

            function onSessionEnded( /*event*/) {

                // currentSession.removeEventListener( 'end', onSessionEnded );

                button.textContent = 'ENTER' + btn_string;

                mySession = null;

            }

            button.style.display = '';
            button.style.cursor = 'pointer';
            button.style.left = 'calc(50% - 50px)';
            button.style.width = '100px';

            button.textContent = 'ENTER ' + btn_string;


            const sessionOptions = {
                ...sessionInit,
                optionalFeatures: [

                    'bounded-floor',
                    'layers',
                    ...(sessionInit.optionalFeatures || [])
                ],
            };

            button.onmouseenter = function () {
                button.style.opacity = '1.0';
            };

            button.onmouseleave = function () {
                button.style.opacity = '0.5';
            };

            button.onclick = function () {
                if (mySession === null) {
                    navigator.xr.requestSession(xr_string, sessionOptions).then(onSessionStarted);
                } else {
                    mySession.end();
                    if (navigator.xr.offerSession !== undefined) {

                        navigator.xr.offerSession(xr_string, sessionOptions)
                            .then(onSessionStarted)
                            .catch((err) => {

                                console.warn(err);

                            });

                    }

                }

            };

            if (navigator.xr.offerSession !== undefined) {
                navigator.xr.offerSession(xr_string, sessionOptions)
                    .then(onSessionStarted)
                    .catch((err) => {
                        console.warn(err);
                    });

            }

        }

        function disableButton() {

            button.style.display = '';

            button.style.cursor = 'auto';
            button.style.left = 'calc(50% - 75px)';
            button.style.width = '150px';

            button.onmouseenter = null;
            button.onmouseleave = null;

            button.onclick = null;

        }

        function showWebXRNotFound() {

            disableButton();

            button.textContent = btn_string + ' NOT SUPPORTED';

        }

        function showVRNotAllowed(exception) {

            disableButton();

            console.warn('Exception when trying to call xr.isSessionSupported', exception);

            button.textContent = btn_string + ' NOT ALLOWED';

        }

        function stylizeElement(element) {

            element.style.position = 'absolute';
            element.style.bottom = '20px';
            element.style.padding = '12px 6px';
            element.style.border = '1px solid #fff';
            element.style.borderRadius = '4px';
            element.style.background = 'rgba(0,0,0,0.1)';
            element.style.color = '#fff';
            element.style.font = 'normal 13px sans-serif';
            element.style.textAlign = 'center';
            element.style.opacity = '0.5';
            element.style.outline = 'none';
            element.style.zIndex = '999';

        }

        if ('xr' in navigator) {

            button.id = 'MyXRButton';
            button.style.display = 'none';

            stylizeElement(button);

            navigator.xr.isSessionSupported(xr_string).then(function (supported) {

                supported ? showEnterVR() : showWebXRNotFound();

                if (supported && MyXRButton.xrSessionIsGranted) {

                    button.click();

                }

            }).catch(showVRNotAllowed);

            return {button: button, referenceSpace: myrefspace, session: mySession};

        } else {

            const message = document.createElement('a');

            if (window.isSecureContext === false) {

                message.href = document.location.href.replace(/^http:/, 'https:');
                message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message

            } else {

                message.href = 'https://immersiveweb.dev/';
                message.innerHTML = 'WEBXR NOT AVAILABLE';

            }

            message.style.left = 'calc(50% - 90px)';
            message.style.width = '180px';
            message.style.textDecoration = 'none';

            stylizeElement(message);

            return message;

        }

    }

    static registerSessionGrantedListener() {

        if (typeof navigator !== 'undefined' && 'xr' in navigator) {

            // WebXRViewer (based on Firefox) has a bug where addEventListener
            // throws a silent exception and aborts execution entirely.
            if (/WebXRViewer\//i.test(navigator.userAgent)) return;

            navigator.xr.addEventListener('sessiongranted', () => {

                MyXRButton.xrSessionIsGranted = true;

            });

        }

    }

}

MyXRButton.xrSessionIsGranted = false;
MyXRButton.registerSessionGrantedListener();

export {MyXRButton};
