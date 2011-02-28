The Instagram JavaScript SDK
============================
A JavaScript library for the Instagram REST and Search APIs
(currently supports authentication, authorization and persisting sessions)

Take a look at the [Instadrop](https://github.com/Instagram/Instadrop) project for an implementation example.


Follow @instagramapi on Twitter
----------------------------
You should [follow @instagramapi on Twitter](http://twitter.com/#!/instagramapi) for announcements,
updates, and news about the Instagram API.


Join the mailing list!
----------------------
<https://groups.google.com/group/instagram-api-developers>


SDK Usage Examples
------------------
    IG.init({
        client_id: YOUR_CLIENT_ID,
        check_status: true, // check and load active session
        cookie: true // persist a session via cookie
    });

    // client side access_token flow (implicit)
    IG.login(function (response) {
        if (response.session) {
            // user is logged in
        }
    }, {scope: ['comments', 'likes']});

    // client side code flow
    IG.login(function (response) {
        if (response.code) {
            // user authorized app, send code to server
            // for access_token exchange
        }
    }, {response_type: 'code', scope: ['comments', 'likes']});

Contributing
------------
In the spirit of [free software](http://www.fsf.org/licensing/essays/free-sw.html), **everyone** is encouraged to help improve this project.

Here are some ways *you* can contribute:

* by using alpha, beta, and prerelease versions
* by reporting bugs
* by suggesting new features
* by writing or editing documentation
* by writing specifications
* by writing code (**no patch is too small**: fix typos, add comments, clean up inconsistent whitespace)
* by refactoring code
* by closing [issues](http://github.com/Instagram/instagram-javascript-sdk/issues)
* by reviewing patches


Submitting an Issue
-------------------
We use the [GitHub issue tracker](http://github.com/Instagram/instagram-javascript-sdk/issues) to track bugs and
features. Before submitting a bug report or feature request, check to make sure it hasn't already
been submitted. You can indicate support for an existing issuse by voting it up. When submitting a
bug report, please include a [Gist](http://gist.github.com/) that includes a stack trace and any
details that may be necessary to reproduce the bug, including your library version, browser version, and
operating system. Ideally, a bug report should include a pull request with failing specs.


Submitting a Pull Request
-------------------------
1. Fork the project.
2. Create a topic branch.
3. Implement your feature or bug fix.
4. Add documentation for your feature or bug fix.
5. Commit and push your changes.
6. Submit a pull request.


Copyright
---------
Copyright (c) 2011 Instagram (Burbn, Inc).
See [LICENSE](https://github.com/Instagram/instagram-javascript-sdk/blob/master/LICENSE.md) for details.
