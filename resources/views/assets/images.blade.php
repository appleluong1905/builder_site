@extends('layouts.master')

@section('title')
Dashboard | Image Library
@endsection

@section('content')

@include('includes.nav-bar')

<div class="container-fluid">
	<div class="row">
		<div class="col-md-9 col-sm-8">
			<h1><span class="fui-image">My Image Library</h1>
		</div><!-- /.col -->
	</div><!-- /.row -->

	<hr class="dashed margin-bottom-50">

	<div class="row">
		<div class="col-md-3">
			<div class="uploadPanel">
				<div class="top">
					<span class="fui-upload"></span> &nbsp;<b>Upload Image(s)</b>
				</div>
				<div class="bottom">
					<form action="{{ route('upload.image') }}" enctype="multipart/form-data" method="post">
						<div class="form-group">
							<div class="fileinput fileinput-new" data-provides="fileinput">
								<div class="fileinput-preview thumbnail" data-trigger="fileinput" style=""></div>
								<div>
									<span class="btn btn-primary btn-embossed btn-file">
										<span class="fileinput-new"><span class="fui-image"></span>&nbsp;&nbsp;Select Image</span>
										<span class="fileinput-exists"><span class="fui-gear"></span>&nbsp;&nbsp;Change</span>
										<input type="file" name="userFile">
									</span>
									<a href="#" class="btn btn-primary btn-embossed fileinput-exists" data-dismiss="fileinput"><span class="fui-trash"></span>&nbsp;&nbsp;Remove</a>
								</div>
							</div>
						</div><!-- /.form-group -->
						<hr class="dashed">
						<input type="hidden" name="_token" value="{{ Session::token() }}">
						<button type="submit" class="btn btn-primary btn-block"><span class="fui-upload"></span> Upload Image</button>
					</form>
				</div><!-- /.bottom -->
			</div><!-- /.uploadPanel -->
		</div><!-- /.col -->

		<div class="col-md-9">
			@if( Session::has('success') )
			<div class="alert alert-success">
				<button type="button" class="close fui-cross" data-dismiss="alert"></button>
				{{ Session::get('success') }}
			</div>
			@endif
			@if( Session::has('error') )
			<div class="alert alert-error">
				<button type="button" class="close fui-cross" data-dismiss="alert"></button>
				{{ Session::get('error') }}
			</div>
			@endif

			<ul class="nav nav-tabs nav-append-content">
				<li class="active"><a href="#myImagesTab">My Images</a></li>
				<li><a href="#adminImagesTab" id="ie_admintab">Other Images</a></li>
			</ul> <!-- /tabs -->

			<div class="tab-content">

				<div class="tab-pane active" id="myImagesTab">
					@if( count($userImages) > 0 )
						<div class="images masonry-3" id="myImages">
							@foreach( $userImages as $user_img )
								<div class="image">
									<div class="imageWrap">
										<a href="#"><img src="{{ URL::to($user_img) }}"></a>
									</div>
									<div class="buttons clearfix">
										<button type="button" class="btn btn-primary btn-embossed btn-sm"><span class="fui-export"></span> View</button>
										<button type="button" class="btn btn-danger btn-embossed btn-sm" data-img="{{ URL::to($user_img) }}"><span class="fui-trash"></span> Delete</button>
									</div>
								</div><!-- /.image -->
							@endforeach
						</div>
					@else
						<!-- Alert Info -->
						<div class="alert alert-info">
							<button type="button" class="close fui-cross" data-dismiss="alert"></button>
							You currently have no images uploaded. To upload images, please use the upload panel on your left.
						</div>
					@endif
				</div><!-- /.tab-pane -->

				<div class="tab-pane" id="adminImagesTab">
					<div class="images masonry-3" id="adminImages">
						@if( isset($adminImages) )
							@foreach( $adminImages as $admin_img )
								<div class="image">
									<div class="imageWrap">
										<a href="#"><img src="{{ URL::to($admin_img) }}"></a>
										<div class="ribbon-wrapper-red"><div class="ribbon-red">Admin</div></div>
									</div>
									<div class="buttons clearfix">
										<button type="button" class="btn btn-primary btn-embossed btn-sm"><span class="fui-export"></span> View</button>
									</div>
								</div><!-- /.image -->
							@endforeach
						@endif
					</div><!-- /.adminImages -->
				</div><!-- /.tab-pane -->
			</div> <!-- /tab-content -->
		</div><!-- /.col -->
	</div><!-- /row -->
</div><!-- /.container -->

<!-- Modals -->

<div class="modal fade viewPic" id="viewPic" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-body">
				<img src="" id="thePic">
			</div><!-- /.modal-body -->
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Close</button>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->


<div class="modal fade deleteImageModal" id="deleteImageModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h4 class="modal-title" id="myModalLabel"><span class="fui-info"></span> Are you sure?</h4>
			</div>
			<div class="modal-body">
				<p>
					Deleting this image is permanent and <b>can not be undone</b>. Are you sure you want to continue?
				</p>
			</div><!-- /.modal-body -->
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Cancel</button>
				<button type="button" class="btn btn-primary" id="deleteImageButton"><span class="fui-check"></span> Permanently delete image</button>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->

@include('includes.modal-account')

<!-- /Modals -->


<!-- Load JS here for greater good =============================-->
<script src="{{ URL::to('src/js/vendor/jquery.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/flat-ui-pro.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/chosen.min.js') }}"></script>
<script src="{{ URL::to('src/js/vendor/jquery.zoomer.js') }}"></script>
<script src="{{ URL::to('src/js/build/images.js') }}"></script>

<script type="text/javascript">
	var token = '{{ Session::token() }}';
</script>

<!--[if lt IE 10]>
<script>
alert('')
$(function(){
	var msnry1 = new Masonry( '#myImages', {
    	// options
    	itemSelector: '.image',
    	"gutter": 20
    });
    $('#ie_admintab').on('shown.bs.tab', function(e){

    	var msnry2 = new Masonry( '#adminImages', {
    	// options
    	itemSelector: '.image',
    	"gutter": 20
    });

    })

})
</script>
<![endif]-->

@endsection