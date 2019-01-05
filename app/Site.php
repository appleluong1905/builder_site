<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
	public function page()
    {
    	return $this->hasMany('App\Page');
    }

    public function user()
    {
    	return $this->belongsTo('App\User');
    }
}
