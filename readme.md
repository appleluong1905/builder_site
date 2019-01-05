## SiteBuilder Lite with Laravel 5.2 PHP Framework

SITEBUILDER Lite takes a block oriented approach to building web pages and web sites. What this is means is that SITEBUILDER Lite provides the user with a selection of pre-designed blocks, such as headers, content sections, forms, footers, etc. which are combined onto a canvas to create fully functional web page.

## Current Version

1.1.1

## Change log

	Version - 1.1.1

	enhancement: Update builder UI.
	bug fix: Can't save previously created site.
	enhancement: updated documentation

	Version - 1.1.0

	bug fix: fix src path of publishing loader gif in js module
	enhancement: seperate installation package
	bug fix: in php 7, bot detect captcha through error
	bug fix: after submit with a email on forgot password it through an error
	enhancement: updated documentation

## Installation Note

### Install with web installer

Clone the project.

Make sure the .env file and /storage folder with all its subfolder has write permission.

Now create a database in MySQL

Point your browser to your_application/public/install

It will start a step by step installation and then you will forwarded to login page.

#### Install with composer

You need to install composer to maintain the dependencies. To install composer go to the following link and follow the instruction.
[Composer Getting Started](https://getcomposer.org/doc/00-intro.md)

Now clone the project then run the following command,

```
composer install
```

#### Configuration

Create a MySQL database

Rename .env.example to .env

Replace the following with database credentials

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=homestead
DB_USERNAME=homestead
DB_PASSWORD=secret
```
#### Run the migrations and data seed

Run the following command

```
php artisan migrate --seed
```

#### Home page and Login

Point your browser to,

```
application_URL/public
```
Login with following default user,

```
User: admin@admin.com
Pass: password
```

# TODO
