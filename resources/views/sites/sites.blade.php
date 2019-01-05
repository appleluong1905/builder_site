@extends('layouts.master')

@section('title')
Welcome Dashboard!
@endsection

@section('content')

@include('includes.nav-bar')

<div class="container-fluid">

    @if( Session::has('error') )
    <div class="row margin-top-20">
        <div class="col-md-12">
            <div class="alert alert-danger margin-bottom-0">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                {{ Session::get('error') }}
            </div>
        </div><!-- /.col -->
    </div>
    @endif

    <div class="row">
        <div class="col-md-9 col-sm-8">
            <h1><span class="fui-windows"></span> Sites</h1>
        </div><!-- /.col -->

        <div class="col-md-3 col-sm-4 text-right">
            <a href="{{ route('site-create') }}" class="btn btn-lg btn-primary btn-embossed btn-wide margin-top-40"><span class="fui-plus"></span> Create New Site</a>
        </div><!-- /.col -->
    </div><!-- /.row -->

    <hr class="dashed">

    <div class="row margin-bottom-30">
        @if (Auth::user()->type == 'admin')
        <div class="col-md-3 col-sm-6">
            <div class="form-group">
                <select name="userDropDown" id="userDropDown" class="form-control select select-inverse btn-block mbl ">
                    <option value="">Filter By User</option>
                    <option value="All">All</option>
                    @foreach($users as $user)
                    <option value="{{ $user->first_name }} {{ $user->last_name }}">{{ $user->first_name }} {{ $user->last_name }}</option>
                    @endforeach
                </select>
            </div>
        </div><!-- /.col -->
        @endif

        <div class="col-md-3 col-sm-6">
            <div class="form-group">
                <select name="sortDropDown" id="sortDropDown" class="form-control select select-inverse select-block mbl" >
                    <option value="">Sory by</option>
                    <option value="CreationDate">Creation date</option>
                    <option value="LastUpdate">Last updated</option>
                    <option value="NoOfPages">Number of pages</option>
                </select>
            </div>
        </div><!-- /.col -->
    </div><!-- /.row -->

    <div class="row">
        @if( isset($sites) && count( $sites ) > 0 )
        <div class="col-md-12">
            <?php //print_r($sites); ?>
            <div class="masonry-4 sites" id="sites">
                @foreach( $sites as $site )
                <?php //print_r($site); ?>
                <div class="site" data-name="{{ $site['siteData']['user']['first_name'] }} {{ $site['siteData']['user']['last_name'] }}" data-pages="{{ $site['nrOfPages'] }}" data-created="{{ date('Y-m-d', strtotime($site['siteData']['created_at'])) }}" data-update="{{ date('Y-m-d', strtotime($site['siteData']['updated_at'])) }}" id="site_{{ $site['siteData']['id'] }}">
                    <div class="window">
                        <div class="top">
                            <div class="buttons clearfix">
                                <span class="left red"></span>
                                <span class="left yellow"></span>
                                <span class="left green"></span>
                            </div>
                            <b>{{ $site['siteData']['site_name'] }}</b>
                        </div><!-- /.top -->

                        <div class="viewport">
                            @if( $site['lastFrame'] != '' )
                            <iframe src="{{ route('getframe', ['frame_id' => $site['lastFrame']['id']]) }}" frameborder="0" scrolling="0" data-height="500" data-siteid="{{ $site['siteData']['id'] }}"></iframe>
                            @else
                            <a href="{{ route('site', ['site_id' => $site['siteData']['id']]) }}" class="placeHolder">
                                <span>This site is empty</span>
                            </a>
                            @endif
                        </div><!-- /.viewport -->

                        <div class="bottom"></div><!-- /.bottom -->
                    </div><!-- /.window -->

                    <div class="siteDetails">
                        <p>
                            Owner: <b>{{ $site['siteData']['user']['first_name'] }} {{ $site['siteData']['user']['last_name'] }}</b>, {{ $site['nrOfPages'] }} Page(s)<br>
                            Created on: <b>{{ date('Y-m-d', strtotime($site['siteData']['created_at'])) }}</b><br>
                            Last edited on: <b>{{ date('Y-m-d', strtotime($site['siteData']['updated_at'])) }}</b>
                        </p>

                        <p class="siteLink">
                            @if( $site['siteData']['ftp_published'] == 1 )
                            @if( $site['siteData']['remote_url'] != '' )
                            <span class="fui-link"></span> <a href="{{ $site['siteData']['remote_url'] }}" target="_blank">{{ $site['siteData']['remote_url'] }}</a>
                            @else
                            Site was published on {{ date('Y-m-d', strtotime($site['siteData']['publish_date'])) }}
                            @endif
                            @else
                            <span class="pull-left text-danger">
                                <b>Site has not been published</b>
                            </span> &nbsp;&nbsp;
                            @if( $site['siteData']['ftp_ok'] == 1 )
                            <a class="btn btn-inverse btn-xs" href="{{ route('site', ['site_id' => $site['siteData']['id']]) }}#publish">
                                <span class="fui-export"></span> Publish Now
                            </a>
                            @endif
                            @endif
                        </p>

                        <hr class="dashed light">

                        <div class="clearfix">
                            <a href="{{ route('site', ['site_id' => $site['siteData']['id']]) }}" class="btn btn-primary btn-embossed btn-block"><span class="fui-new"></span> Edit This Site</a>
                            <a href="#" class="btn btn-info btn-embossed btn-block btn-half pull-left btn-sm siteSettingsModalButton first" data-siteid="{{ $site['siteData']['id'] }}"><span class="fui-gear"></span> Settings</a>
                            <a href="#deleteSiteModal" class="btn btn-danger btn-embossed btn-block btn-half pull-left deleteSiteButton btn-sm second" id="deleteSiteButton" data-siteid="{{ $site['siteData']['id'] }}"><span class="fui-trash"></span> Delete</a>
                        </div>
                    </div><!-- /.siteDetails -->
                </div><!-- /.site -->
                @endforeach
            </div><!-- /.masonry -->
        </div><!-- /.col -->
        @else
        <div class="col-md-6 col-md-offset-3">
            <div class="alert alert-info" style="margin-top: 30px">
                <button type="button" class="close fui-cross" data-dismiss="alert"></button>
                <h2>Well, hello there!</h2>
                <p>
                    It appears you might be new around these parts. At the moment, you don't have any sites to call your own just yet, so why not get started and build yourself one awesome little website?
                </p>
                <br><br>
                <a href="{{ route('site-create') }}" class="btn btn-primary btn-lg btn-wide">Yes, I want to build a website!</a>
                <a href="#" class="btn btn-default btn-lg btn-wide" data-dismiss="alert">Nah, maybe later</a>
            </div>
        </div><!-- ./col -->
        @endif

    </div><!-- /.row -->

</div><!-- /.container -->

<!-- modals -->

@include('includes.modal-sitesettings')

@include('includes.modal-account')

@include('includes.modal-deletesite')

<!-- /modals -->

<!-- Load JS here for greater performance -->
<script src="{{ URL::to('src/js/vendor/jquery.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/jquery-ui.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/flat-ui-pro.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/jquery.zoomer.js') }}"></script>
<script src="{{ URL::to('src/js/build/sites.js') }}"></script>

<!--[if lt IE 10]>
<script>
$(function(){
	var msnry = new Masonry( '#sites', {
    	// options
    	itemSelector: '.site',
    	"gutter": 20
    });

})
</script>
<![endif]-->
@endsection