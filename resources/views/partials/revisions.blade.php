@if( $data )
@foreach( $data as $revision )
	<li>
		<span class="fui-arrow-right"></span>
		{{ date('Y-m-d H:i:s', strtotime($revision->updated_at)) }}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		<a href="{{ route('revision.preview', ['site_id' => $revision->site_id, 'datetime' => strtotime($revision->updated_at), 'page' => $page]) }}" target="_blank" title="Preview Revision">
			<span class="fui-export"></span>
		</a>
		&nbsp;
		<a href="{{ route('revision.delete', ['site_id' => $revision->site_id, 'datetime' => strtotime($revision->updated_at), 'page' => $page]) }}" title="Delete Revision" class="link_deleteRevision">
			<span class="fui-trash text-danger"></span>
		</a>
		&nbsp;
		<a href="{{ route('revision.restore', ['site_id' => $revision->site_id, 'datetime' => strtotime($revision->updated_at), 'page' => $page]) }}" title="Restore Revision" class="link_restoreRevision">
			<span class="fui-power text-primary"></span>
		</a>
	</li>
@endforeach
@endif
