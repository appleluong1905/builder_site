<form class="form-horizontal" role="form" id="pageSettingsForm" action="{{ route('updatePageData') }}">
	<input type="hidden" name="siteID" id="siteID" value="{{ $data['index']['site_id'] }}">
	{{-- print_r($data) --}}
	<input type="hidden" name="pageID" id="pageID" value="{{ $data['index']['id'] }}">
	<input type="hidden" name="pageName" id="pageName" value="">
	<div class="optionPane">
		<div class="form-group">
			<label for="name" class="col-sm-3 control-label">Page Title:</label>
			<div class="col-sm-9">
				<input type="text" class="form-control" id="pageData_title" name="pageData_title" placeholder="Page title" value="{{ $data['index']['title'] }}">
			</div>
		</div>
		<div class="form-group">
			<label for="name" class="col-sm-3 control-label">Page Meta Keywords:</label>
			<div class="col-sm-9">
				<textarea class="form-control" id="pageData_metaKeywords" name="pageData_metaKeywords" placeholder="Page meta keywords">{{ $data['index']['meta_keywords'] }}</textarea>
			</div>
		</div>
		<div class="form-group">
			<label for="name" class="col-sm-3 control-label">Page Meta Description:</label>
			<div class="col-sm-9">
				<textarea class="form-control" id="pageData_metaDescription" name="pageData_metaDescription" placeholder="Page meta description">{{ $data['index']['meta_description'] }}</textarea>
			</div>
		</div>
		<div class="form-group">
			<label for="name" class="col-sm-3 control-label">Header Includes:</label>
			<div class="col-sm-9">
				<textarea class="form-control" id="pageData_headerIncludes" name="pageData_headerIncludes" rows="7" placeholder="Additional code you'd like to include in the <head> section">{{ $data['index']['header_includes'] }}</textarea>
			</div>
		</div>
		<div class="form-group">
			<label for="name" class="col-sm-3 control-label">Page CSS:</label>
			<div class="col-sm-9">
				<textarea class="form-control" id="pageData_headerCss" name="pageData_headerCss" rows="7" placeholder="CSS applied specifically to this page">{{ $data['index']['css'] }}</textarea>
			</div>
		</div>
	</div><!-- /.optionPane -->
</form>