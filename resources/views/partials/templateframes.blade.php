<?php foreach( $pages as $key => $frames ):
	$frameIDs = array();
	$indivHeights = array();
	$totalHeight = 0;
	foreach( $frames as $frame ) {
		//frame ID's
		$frameIDs[] = $frame['id'];
		//total height
		$totalHeight += $frame['height'];
		//individual heights
		$indivHeights[] = $frame['height'];
		//original Urls
		$urls[] = $frame['original_url'];
	}
	$pageName = $frames[0]['pageName'];
	$pageID = $frames[0]['pageID'];
	$frameIDstring = implode("-", $frameIDs);
	$indivHeightsString = implode("-", $indivHeights);
	$originalUrlsString = implode("-", $urls);
?>
<li class="templ" data-frames="<?php echo $frameIDstring;?>" data-heights="<?php echo $indivHeightsString;?>" data-originalurls="<?php echo $originalUrlsString;?>" data-name="<?php echo $pageName?>" data-pageid="<?php echo $pageID;?>">
	<iframe frameborder="0" scrolling="no" src="<?php //echo site_url('temple/index/'.$key)?>" data-height="<?php echo $totalHeight;?>"></iframe>
</li>
<?php endforeach;?>