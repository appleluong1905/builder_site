@foreach ($users as $user)
<div class="user" data-name="{{ $user['userData']->first_name }} {{ $user['userData']->last_name }}">
	<div class="topPart clearfix">
		<img src="{{ URL::to('src/images/dude.png') }}" class="pic">
		<div class="details">
			<h4>{{ $user['userData']->first_name }} {{ $user['userData']->last_name }}</h4>
			<p>
				<span class="fui-mail"></span> <a href="">{{ $user['userData']->email }}</a>
			</p>
		</div><!-- /.details -->
	</div><!-- /.topPart -->
	<div class="bottom">
		<div class="loader" style="display: none;">
			<img src="{{ URL::to('src/images/loading.gif') }}" alt="Loading...">
		</div>
		<div class="alerts"></div>
		<ul class="nav nav-tabs nav-append-content">
			<li class="active"><a href="#{{ $user['userData']->id }}_account"><span class="fui-user"></span> Account</a></li>
			<li><a href="#{{ $user['userData']->id }}_sites"><span class="fui-window"></span> Sites (<span class="text-primary">{{ count($user['site']) }}</span>)</a></li>
		</ul><!-- /tabs -->
		<div class="tab-content clearfix">
			<div class="tab-pane clearfix" id="{{ $user['userData']->id }}_sites">
				<div class="userSites">
					@if (count($user['site']) == 0)
					<!-- Alert Info -->
					<div class="alert alert-info">
						<button type="button" class="close fui-cross" data-dismiss="alert"></button>
						This user has not created any sites yet.
					</div>
					@endif

					@foreach ($user['site'] as $site)
					<div class="userSite site">
						<div class="window">
							<div class="top">
								<div class="buttons clearfix">
									<span class="left red"></span>
									<span class="left yellow"></span>
									<span class="left green"></span>
								</div>
								<?php //dd($site); ?>
								<b>{{ $site['siteData']['site_name'] }}</b>
							</div><!-- /.top -->
							<div class="viewport">
								@if ($site['lastFrame'] != '')
								<iframe src="{{ route('getframe', ['frame_id' => $site['lastFrame']['id']]) }}" frameborder="0" scrolling="0" data-height="{{ $site['lastFrame']['height'] }}" data-siteid="{{ $site['lastFrame']['site_id'] }}"></iframe>
								@else
								<a href="{{ route('site', ['site_id' => $site['siteData']['id']]) }}" class="placeHolder">
									<span>This site is empty</span>
								</a>
								@endif
							</div><!-- /.viewport -->
						</div><!-- /.window -->
						<div class="siteButtons clearfix">
							<a href="{{ route('site', ['site_id' => $site['siteData']['id']]) }}" class="btn btn-primary btn-sm btn-embossed"><span class="fui-new"></span> Edit</a>
							<a href="#" class="btn btn-info btn-sm btn-embossed siteSettingsModalButton" data-siteid="{{ $site['siteData']['id'] }}"><span class="fui-gear"></span> Settings</a>
							<a href="#deleteSiteModal" class="btn btn-danger btn-sm btn-embossed deleteSiteButton" data-siteid="{{ $site['siteData']['id'] }}"><span class="fui-trash"></span> Delete</a>
						</div>
					</div><!-- /.userSite -->
					@endforeach
				</div><!-- /.userSites -->
			</div><!-- /.tab-pane -->
			<div class="tab-pane active" id="{{ $user['userData']->id }}_account">
				@include('partials.userdetails')
				<hr class="dashed">
				<div class="actions clearfix">
					<a href="#" class="btn btn-info btn-embossed btn-block passwordReset" data-userid="{{ $user['userData']->id }}"><span class="fui-mail"></span> Send Password Reset Email</a>
					<div>
						<a href="{{ route('user-delete', ['user_id' => $user['userData']->id]) }}" class="btn btn-danger btn-embossed deleteUserButton"><span class="fui-cross-inverted"></span> Delete Account</a>
						<span>
							@if ($user['userData']->active == 1)
							<a href="{{ route('user-enable-disable', ['user_id' => $user['userData']->id]) }}" class="btn btn-default btn-embossed"><span class="fui-power"></span> Disable</a>
							@else
							<a href="{{ route('user-enable-disable', ['user_id' => $user['userData']->id]) }}" class="btn btn-inverse btn-embossed"><span class="fui-power"></span> Enable</a>
							@endif
						</span>
					</div>
				</div><!-- /.actions -->
			</div><!-- /.tab-pane -->
		</div> <!-- /tab-content -->
	</div><!-- /.bottom -->
	@if ($user['userData']->active == 0)
	<div class="ribbon-wrapper"><div class="ribbon">disabled</div></div>
	@endif
</div><!-- /.user -->
@endforeach